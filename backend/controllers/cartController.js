import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";

// Helper to parse key
const parseKey = (key) => key.split('_note_')[0];

// add items to user cart
const addToCart = async (req, res) => {
  try {
    // Auth middleware now puts id in req.user
    // Fallback to req.body.userId only if not set (legacy/unprotected)
    let userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    let cartData = await userData.cartData;
    const itemKey = req.body.itemId; // This might be composite now
    const realId = parseKey(itemKey);

    // Check Stock Consistency
    const food = await foodModel.findById(realId);
    if (!food) {
        return res.json({ success: false, message: "Item not found" });
    }
    
    // Calculate total quantity of this REAL item in cart
    let totalQty = 0;
    for (const k in cartData) {
        if (parseKey(k) === realId) {
            totalQty += cartData[k];
        }
    }

    if (food.trackStock && (totalQty + 1 > food.stock)) {
        return res.json({ success: false, message: "Not enough stock" });
    }

    if (!cartData[itemKey]) {
      cartData[itemKey] = 1;
    } else {
      cartData[itemKey] += 1;
    }
    
    // Minimize cartData to remove zeros if any (Clean up)
    await userModel.findByIdAndUpdate(req.user ? req.user.id : req.body.userId, { cartData });
    res.json({ success: true, message: "Added to Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// remove from cart
const removeFromCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    let cartData = await userData.cartData;
    const itemKey = req.body.itemId;
    
    if (cartData[itemKey] > 1) {
      cartData[itemKey] -= 1;
    } else {
      delete cartData[itemKey];
    }
    await userModel.findByIdAndUpdate(req.user ? req.user.id : req.body.userId, { cartData });
    res.json({ success: true, message: "Removed from Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// fetch user cart data
const getCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    let cartData = await userData.cartData;
    res.json({ success: true, cartData: cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Update Note (Swap Keys)
const updateCartNote = async (req, res) => {
  try {
    let userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    let cartData = await userData.cartData;
    
    const { itemId, oldNote, newNote, quantity } = req.body;
    
    // Construct keys
    const oldKey = oldNote ? `${itemId}_note_${oldNote}` : itemId;
    const newKey = newNote ? `${itemId}_note_${newNote}` : itemId;
    
    // Check if old key exists
    if (!cartData[oldKey]) {
        return res.json({ success: false, message: "Item not found in cart" });
    }
    
    // Remove old key
    delete cartData[oldKey];
    
    // Add new key (Merge if exists)
    if (cartData[newKey]) {
        cartData[newKey] += quantity;
    } else {
        cartData[newKey] = quantity;
    }
    
    await userModel.findByIdAndUpdate(req.user ? req.user.id : req.body.userId, { cartData });
    res.json({ success: true, message: "Note updated" });
    
  } catch (error) {
     console.log(error);
     res.json({ success: false, message: "Error" });
  }
};

export { addToCart, removeFromCart, getCart, updateCartNote };
