import { useContext, useMemo } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { Input } from "antd";

const Cart = () => {
  const {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    orderType,
    updateCartNote // Task 2: Import new helper
  } = useContext(StoreContext);

  const navigate = useNavigate();
  // Calculate Fee based on Order Type
  const deliveryFee = orderType === "Delivery" ? 15000 : 0;
  const isDineIn = orderType === "Dine-in";

  // MEMOIZED UPSELL CANDIDATES (Stable Shuffle)
  const upsellCandidates = useMemo(() => {
     return food_list
        .filter(item => (item.category && item.category.toLowerCase().includes("combo")) || (item.originalPrice && item.originalPrice > item.price))
        .sort(() => 0.5 - Math.random());
  }, [food_list]); // Only re-shuffle when menu loads

  // Filter out items already in cart (Dynamic)
  const displayUpsells = upsellCandidates.filter(item => !cartItems[item._id]).slice(0, 3);

  return (
    <>
      <div className="cart">
        <div className="cart-items">
          <div className="cart-items-title">
            <p>Hình ảnh</p>
            <p>Tên món</p>
            <p>Giá</p>
            <p>Số lượng</p>
            <p>Thành tiền</p>
            <p>Xóa</p>
          </div>
          <br />
          <hr />
          {food_list.map((item, index) => {
            // Find all cart entries for this item (including variants with notes)
            const relatedKeys = Object.keys(cartItems).filter(k => k.split('_note_')[0] === item._id);

            return relatedKeys.map(key => {
                const quantity = cartItems[key];
                if (quantity > 0) {
                   const note = key.split('_note_')[1]; // Extract note if exists
                   
                   return (
                    <div key={key}>
                      <div className="cart-items-title cart-items-item">
                        <img src={url + "/images/" + item.image} alt="" />
                        <div>
                            <p>{item.name}</p>
                            {/* Note Input */}
                            <Input.TextArea 
                                placeholder="Ghi chú (VD: Không hành...)" 
                                defaultValue={note}
                                autoSize={{ minRows: 1, maxRows: 3 }}
                                maxLength={100}
                                style={{ 
                                    fontSize: '13px', 
                                    marginTop: '4px', 
                                    backgroundColor: 'transparent',
                                    padding: '4px 8px',
                                    minWidth: '200px'
                                }}
                                onBlur={(e) => {
                                    const newNote = e.target.value.trim();
                                    // Treat null/undefined as empty string for comparison
                                    const currentNote = note || "";
                                    
                                    if (newNote !== currentNote) { 
                                         // Update Cart Note
                                         // If note is "", backend handles it (key becomes itemId)
                                         // Frontend needs to handle key transition.
                                         updateCartNote(item._id, note, newNote, quantity);
                                    }
                                }}
                            />
                        </div>
                        <p>{item.price.toLocaleString('vi-VN')} đ</p>
                        <p>{quantity}</p>
                        <p>{(item.price * quantity).toLocaleString('vi-VN')} đ</p>
                        <p onClick={() => removeFromCart(key)} className="cross">
                          x
                        </p>
                      </div>
                      <hr />
                    </div>
                  );
                }
                return null;
            });
          })}
        </div>
        <div className="cart-bottom">
          <div className="cart-total">
            <h2>Tổng giỏ hàng</h2>
            <div>
              <div className="cart-total-details">
                <p>Tạm tính</p>
                <p>{getTotalCartAmount().toLocaleString('vi-VN')} đ</p>
              </div>
              <hr />
              <div className="cart-total-details">
                <p>{isDineIn ? "Phí phục vụ" : "Phí giao hàng"}</p>
                <p>{getTotalCartAmount() === 0 ? "0 đ" : deliveryFee.toLocaleString('vi-VN') + " đ"}</p>
              </div>
              <hr />
              <div className="cart-total-details">
                <b>Tổng cộng</b>
                <b>{getTotalCartAmount() === 0 ? "0 đ" : (getTotalCartAmount() + deliveryFee).toLocaleString('vi-VN')} đ</b>
              </div>
            </div>
            <button className="desktop-checkout-btn" onClick={() => navigate('/order')}>TIẾN HÀNH THANH TOÁN</button>
          </div>
          <div className="cart-promocode">
            <div>
              <p>Nếu bạn có mã giảm giá, nhập tại đây</p>
              <div className="cart-promocode-input">
                <input type="text" placeholder="Mã giảm giá" />
                <button>Áp dụng</button>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* SMART UPSELL SECTION */}
      {food_list.length > 0 && Object.keys(cartItems).length > 0 && displayUpsells.length > 0 && (
        <div className="cart-upsell">
            <h3>🔥 Có thể bạn sẽ thích</h3>
            <div className="cart-upsell-list">
                {displayUpsells.map(item => {
                    // Calculate Savings
                    const hasSavings = item.originalPrice && item.originalPrice > item.price;
                    const savingsAmount = hasSavings ? item.originalPrice - item.price : 0;
                    const savingsPercent = hasSavings ? Math.round((savingsAmount / item.originalPrice) * 100) : 0;

                    return (
                        <div key={item._id} className="upsell-item">
                            <div style={{position: 'relative'}}>
                                <img src={url + "/images/" + item.image} alt={item.name} />
                                {hasSavings && (
                                    <div className="cart-savings-badge">
                                        -{savingsPercent}%
                                    </div>
                                )}
                            </div>
                            <div className="upsell-info">
                                <p className="upsell-name">{item.name}</p>
                                <p className="upsell-price">
                                    {item.price.toLocaleString('vi-VN')} đ
                                    {hasSavings && <span className="upsell-original">{item.originalPrice.toLocaleString('vi-VN')}đ</span>}
                                </p>
                                {hasSavings && (
                                    <p className="upsell-savings-text">Tiết kiệm: {savingsAmount.toLocaleString('vi-VN')}đ</p>
                                )}
                                <button onClick={() => addToCart(item._id)}>+ Thêm</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      <div className="mobile-sticky-checkout">
        <div className="sticky-checkout-info">
          <span className="sticky-checkout-label">Tổng cộng</span>
          <span className="sticky-checkout-total">
            {getTotalCartAmount() === 0 
              ? "0 đ" 
              : (getTotalCartAmount() + deliveryFee).toLocaleString('vi-VN') + " đ"
            }
          </span>
        </div>
        <button 
          className="sticky-checkout-btn" 
          onClick={() => navigate('/order')}
          disabled={getTotalCartAmount() === 0}
        >
          Thanh toán
        </button>
      </div>
    </>
  );
};

export default Cart;
