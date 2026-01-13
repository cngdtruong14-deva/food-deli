"""
AI Service - Python Microservice for Food Delivery App
======================================================
This microservice handles Data Science and AI tasks:
- Smart Combo recommendations using Co-occurrence analysis
- Future: Demand forecasting, sentiment analysis, etc.

Runs on port 5001 and communicates with Node.js backend.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import pandas as pd
from collections import Counter
from bson import ObjectId

# Robust Env Loading
# Get the path to the directory above 'ai_service'
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

# Paths to check: 
# 1. ../backend/.env (If running from ai_service folder)
# 2. ../.env (If running from root)
backend_env = os.path.join(parent_dir, 'backend', '.env')
root_env = os.path.join(parent_dir, '.env')

if os.path.exists(backend_env):
    print(f"✅ [AI Service] Loading .env from: {backend_env}")
    load_dotenv(backend_env)
elif os.path.exists(root_env):
    print(f"✅ [AI Service] Loading .env from: {root_env}")
    load_dotenv(root_env)
else:
    print("⚠️ [AI Service] .env not found in standard locations. Checking local...")
    load_dotenv() # Fallback


app = Flask(__name__)
CORS(app)

# MongoDB Connection - Same database as Node.js backend
# MongoDB Connection - Same database as Node.js backend
# Support both naming conventions (MONGO_URI or MONGO_URL)
MONGO_URI = os.getenv('MONGO_URI') or os.getenv('MONGO_URL') or 'mongodb://localhost:27017/food-delivery'
client = MongoClient(MONGO_URI)
db = client.get_default_database()

# If no default database in URI, use 'food-delivery'
if db is None:
    db = client['food-delivery']

print(f"[AI Service] Connected to MongoDB: {MONGO_URI}")


# =============================================================================
# HEALTH CHECK ENDPOINT
# =============================================================================
@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint to verify service is running."""
    return jsonify({
        "status": "AI Service Ready",
        "version": "1.0.0",
        "endpoints": [
            "GET / - Health check",
            "POST /api/recommend/combo - Get smart combo recommendations"
        ]
    })


# =============================================================================
# SMART COMBO RECOMMENDATION API
# =============================================================================
@app.route('/api/recommend/combo', methods=['POST'])
def get_combo_recommendations():
    """
    Smart Combo Recommendation using Co-occurrence Analysis (Pandas Implementation)
    =============================================================================
    
    Logic:
    1. Fetch completed orders.
    2. Convert to Pandas DataFrame for efficient processing.
    3. Filter orders containing the input Food ID.
    4. Calculate value counts of other items in valid orders.
    """
    try:
        data = request.get_json()
        
        if not data or 'food_id' not in data:
            return jsonify({
                "success": False,
                "message": "Missing food_id in request body"
            }), 400
        
        input_food_id = data['food_id']
        
        # Step 1: Fetch completed orders
        orders_cursor = db.orders.find({
            "status": {"$in": ["Paid", "Served", "Delivered"]}
        }, {"items": 1})
        
        # Convert cursor to list/DataFrame
        # We need a list of records where each record represents an item in an order
        # Structure: order_index | food_id
        
        all_order_items = []
        
        for idx, order in enumerate(orders_cursor):
            items = order.get('items', [])
            for item in items:
                # Extract food ID
                food_id = item.get('_id') or item.get('foodId') or item.get('food_id')
                if food_id:
                    all_order_items.append({
                        "order_id": idx, # using index as dummy ID is sufficient for grouping
                        "food_id": str(food_id)
                    })
        
        if not all_order_items:
            return jsonify({
                "success": True,
                "recommendations": [],
                "message": "No order history available"
            })

        # Step 2: Create DataFrame
        df = pd.DataFrame(all_order_items)
        
        # Step 3: Find orders containing the input food
        # Get unique order_ids that have the input_food_id
        orders_with_input = df[df['food_id'] == input_food_id]['order_id'].unique()
        
        if len(orders_with_input) == 0:
            return jsonify({
                "success": True,
                "recommendations": [],
                "message": "No orders found containing this food item"
            })
            
        # Step 4: Filter DataFrame to only include these orders
        relevant_df = df[df['order_id'].isin(orders_with_input)]
        
        # Step 5: Exclude the input food itself
        relevant_df = relevant_df[relevant_df['food_id'] != input_food_id]
        
        # Step 6: Count occurrences of other foods
        if relevant_df.empty:
             return jsonify({
                "success": True,
                "recommendations": [],
                "message": "No associated items found"
            })
            
        # Value counts gives us the most frequent items
        top_items = relevant_df['food_id'].value_counts().head(3)
        
        # Step 7: Format response
        recommended_food_ids = top_items.index.tolist()
        
        # Fetch details for these foods
        try:
            object_ids = [ObjectId(fid) for fid in recommended_food_ids]
            foods_cursor = db.foods.find({"_id": {"$in": object_ids}})
        except:
             foods_cursor = db.foods.find({"_id": {"$in": recommended_food_ids}})
             
        foods_dict = {str(food['_id']): food for food in foods_cursor}
        
        recommendations = []
        for food_id in recommended_food_ids:
            count = int(top_items[food_id])
            food_info = foods_dict.get(food_id, {})
            recommendations.append({
                "_id": food_id,
                "name": food_info.get('name', 'Unknown'),
                "image": food_info.get('image', ''),
                "price": food_info.get('price', 0),
                "co_occurrence_count": count
            })
            
        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "input_food_id": input_food_id
        })
        
    except Exception as e:
        print(f"[AI Service] Error in combo recommendation: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error processing recommendation: {str(e)}"
        }), 500


# =============================================================================
# DEMAND FORECASTING API
# =============================================================================
@app.route('/api/forecast/ingredients', methods=['GET'])
def forecast_ingredients():
    """
    AI Demand Forecasting: Predict ingredient needs for tomorrow based on sales history.
    Returns a list of ingredients that need restocking with status (CRITICAL/WARNING/SAFE).
    """
    try:
        from datetime import datetime, timedelta
        
        # Step 0: Fetch completed orders from last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        orders_cursor = db.orders.find({
            "status": {"$in": ["Paid", "Served", "Delivered"]},
            "date": {"$gte": thirty_days_ago}
        }, {"items": 1, "date": 1})
        
        orders_list = list(orders_cursor)
        
        if len(orders_list) < 3:
            return jsonify({
                "success": True,
                "data": [],
                "message": "Chưa đủ dữ liệu để dự báo (Cần ít nhất 3 đơn hàng trong 30 ngày qua)"
            })
        
        # Step A: Aggregate sales by food_id and date
        sales_data = []
        for order in orders_list:
            order_date = order.get('date')
            if isinstance(order_date, datetime):
                date_str = order_date.strftime('%Y-%m-%d')
            else:
                date_str = str(order_date)[:10]
                
            for item in order.get('items', []):
                food_id = str(item.get('_id') or item.get('foodId') or '')
                quantity = item.get('quantity', 1)
                if food_id:
                    sales_data.append({
                        'food_id': food_id,
                        'date': date_str,
                        'quantity': quantity
                    })
        
        if not sales_data:
            return jsonify({
                "success": True,
                "data": [],
                "message": "Không có dữ liệu bán hàng trong 30 ngày qua"
            })
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(sales_data)
        
        # Group by food_id, sum quantities per day
        daily_sales = df.groupby(['food_id', 'date'])['quantity'].sum().reset_index()
        
        # Step A.2: Predict tomorrow's sales using Weighted Moving Average
        # Weights: Last 7 days = 3x, Last 14 days = 2x, Older = 1x
        predicted_sales = {}
        today = datetime.now()
        
        for food_id in daily_sales['food_id'].unique():
            food_data = daily_sales[daily_sales['food_id'] == food_id]
            
            total_weighted = 0
            total_weight = 0
            
            for _, row in food_data.iterrows():
                try:
                    row_date = datetime.strptime(row['date'], '%Y-%m-%d')
                    days_ago = (today - row_date).days
                    
                    # Assign weight
                    if days_ago <= 7:
                        weight = 3
                    elif days_ago <= 14:
                        weight = 2
                    else:
                        weight = 1
                    
                    total_weighted += row['quantity'] * weight
                    total_weight += weight
                except:
                    pass
            
            if total_weight > 0:
                # Predicted daily average
                avg_prediction = total_weighted / total_weight
                # Add 20% buffer for safety
                predicted_sales[food_id] = round(avg_prediction * 1.2, 2)
        
        # Step B: Fetch recipes and calculate ingredient needs
        recipe_cursor = db.recipes.find({})
        recipes = {str(r['foodId']): r.get('ingredients', []) for r in recipe_cursor}
        
        ingredient_needs = {}  # { ingredient_id: total_quantity_needed }
        
        for food_id, predicted_qty in predicted_sales.items():
            if food_id in recipes:
                for ing in recipes[food_id]:
                    ing_id = str(ing.get('ingredientId', ''))
                    qty_per_unit = ing.get('quantityNeeded', 0)
                    unit = ing.get('unit', '')
                    
                    if ing_id:
                        if ing_id not in ingredient_needs:
                            ingredient_needs[ing_id] = {'quantity': 0, 'unit': unit}
                        ingredient_needs[ing_id]['quantity'] += predicted_qty * qty_per_unit
        
        # Step C: Fetch current stock levels and compare
        stock_cursor = db.stocks.find({"branch": None})  # Central warehouse
        stock_levels = {str(s['ingredient']): s.get('quantity', 0) for s in stock_cursor}
        
        # Fetch ingredient names
        ing_ids = [ObjectId(iid) for iid in ingredient_needs.keys() if ObjectId.is_valid(iid)]
        ingredients_cursor = db.ingredients.find({"_id": {"$in": ing_ids}})
        ingredient_names = {str(ing['_id']): ing.get('name', 'Unknown') for ing in ingredients_cursor}
        
        # Build result
        result = []
        for ing_id, need_data in ingredient_needs.items():
            current = stock_levels.get(ing_id, 0)
            needed = round(need_data['quantity'], 2)
            
            # Determine status
            if current < needed:
                status = "CRITICAL"
            elif current < needed * 1.5:
                status = "WARNING"
            else:
                status = "SAFE"
            
            result.append({
                "_id": ing_id,
                "name": ingredient_names.get(ing_id, 'Unknown'),
                "unit": need_data['unit'],
                "currentStock": current,
                "predictedNeed": needed,
                "deficit": round(max(0, needed - current), 2),
                "status": status
            })
        
        # Sort by status priority (CRITICAL first)
        status_order = {"CRITICAL": 0, "WARNING": 1, "SAFE": 2}
        result.sort(key=lambda x: (status_order.get(x['status'], 99), -x['deficit']))
        
        return jsonify({
            "success": True,
            "data": result,
            "message": f"Dự báo dựa trên {len(orders_list)} đơn hàng trong 30 ngày qua"
        })
        
    except Exception as e:
        print(f"[AI Service] Error in demand forecasting: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error processing forecast: {str(e)}"
        }), 500

# =============================================================================
# RUN THE SERVICE
# =============================================================================
if __name__ == '__main__':
    port = int(os.getenv('AI_SERVICE_PORT', 5001))
    print(f"[AI Service] Starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
