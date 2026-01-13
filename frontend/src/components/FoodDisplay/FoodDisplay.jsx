import React, { useContext, useState, useEffect } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import Skeleton from "../Skeleton/Skeleton";



const FoodDisplay = ({ category }) => {
  const { food_list, searchQuery, categories } = useContext(StoreContext);
  // Initialize loading based on whether food_list is empty
  const [loading, setLoading] = useState(food_list.length === 0);

  // Update loading state when food_list changes
  useEffect(() => {
     if (food_list.length > 0) {
         setLoading(false);
     }
  }, [food_list]);

  const renderSkeleton = () => {
      return Array(8).fill(0).map((_, i) => (
          <div key={i} className="food-item-skeleton">
              <Skeleton type="image" height="200px" />
              <div style={{ padding: '20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                     <Skeleton width="60%" height="24px" />
                     <Skeleton width="20%" height="24px" />
                  </div>
                  <Skeleton width="90%" height="16px" style={{ marginBottom:'5px' }} />
                  <Skeleton width="70%" height="16px" style={{ marginBottom:'15px' }} />
                  <Skeleton width="40%" height="28px" />
              </div>
          </div>
      ));
  }

  // Helper to filter foods
  const getFilteredFoods = (catName) => {
      return food_list.filter(item => 
          item.category === catName && 
          (!searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }

  // Get Combos / Special Offers




  return (
    <div className="food-display" id="food-display">


      <h2>Món ngon gần bạn</h2> 
      
      {loading ? (
        <div className="food-display-list">
            {renderSkeleton()}
        </div>
      ) : (
        <>
            {category === "All" ? (
                // Grouped View
                categories.map((cat, index) => {
                    const foods = getFilteredFoods(cat.name);
                    if (foods.length === 0) return null;

                    return (
                        <div key={index} className="food-category-section">
                            <h3 className="category-title">{cat.name}</h3>
                            <div className="food-display-list">
                                {foods.map((item) => (
                                    <FoodItem
                                        key={item._id}
                                        id={item._id}
                                        name={item.name}
                                        description={item.description}
                                        price={item.price}
                                        image={item.image}
                                        stock={item.stock || 100}
                                        originalPrice={item.originalPrice}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                // Single Category View
                <div className="food-display-list">
                    {getFilteredFoods(category).map((item) => (
                        <FoodItem
                            key={item._id}
                            id={item._id}
                            name={item.name}
                            description={item.description}
                            price={item.price}
                            image={item.image}
                            stock={item.stock || 100}
                            originalPrice={item.originalPrice}
                        />
                    ))}
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default FoodDisplay;
