import React, { useContext, useEffect, useState } from 'react';
import './SpecialOffers.css';
import { StoreContext } from '../../context/StoreContext';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { FaFire } from 'react-icons/fa';
import FoodItem from '../FoodItem/FoodItem';


const SpecialOffers = () => {
  const { food_list } = useContext(StoreContext);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    // Filter for combos or synthesized deals
    const deals = food_list.filter(item => {
        // Logic 1: Explicit "Combo" in category/Name
        const isCombo = (item.category && item.category.toLowerCase().includes("combo")) || 
                        item.name.toLowerCase().includes("combo");
        
        // Logic 2: Has original price > current price (Backend provided)
        const hasDiscount = item.originalPrice && item.originalPrice > item.price;

        return isCombo || hasDiscount;
    }).map(item => {
        // Synthesize discount data if missing
        let finalOriginal = item.originalPrice;
        if (!finalOriginal || finalOriginal <= item.price) {
             // Fake a discount for Combos to make them attractive if DB doesn't have it
             if (item.name.toLowerCase().includes("combo")) {
                 finalOriginal = Math.ceil(item.price * 1.15 / 1000) * 1000;
             }
        }
        
        const savingsAmount = finalOriginal ? finalOriginal - item.price : 0;
        const savingsPercent = finalOriginal ? Math.round((savingsAmount / finalOriginal) * 100) : 0;

        return { ...item, finalOriginal, savingsPercent, savingsAmount };
    });

    setOffers(deals);
  }, [food_list]);

  if (offers.length === 0) return null;

  const responsive = {
    superLargeDesktop: { breakpoint: { max: 4000, min: 3000 }, items: 4 },
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3 },
    tablet: { breakpoint: { max: 1024, min: 600 }, items: 2 },
    mobile: { breakpoint: { max: 600, min: 0 }, items: 1 }
  };

  return (
    <div className="special-offers-section" id="special-offers">
      <div className="special-offers-header">
        <div className="special-offers-title">
            <FaFire className="fire-icon animate-bounce" />
            <h2>Ưu Đãi Hot & Combo Tiết Kiệm</h2>
        </div>
      </div>

      <div className="carousel-container">
        <Carousel 
            responsive={responsive}
            infinite={true}
            autoPlay={true}
            autoPlaySpeed={4000}
            itemClass="react-multi-carousel-item"
            containerClass="carousel-track-container"
            removeArrowOnDeviceType={["tablet", "mobile"]}
        >
            {offers.map((item) => (
                <div key={item._id} style={{ padding: '10px', height: '100%' }}>
                    <FoodItem
                        id={item._id}
                        name={item.name}
                        description={item.description}
                        price={item.price}
                        image={item.image}
                        stock={item.stock || 100}
                        originalPrice={item.originalPrice}
                    />
                </div>
            ))}
        </Carousel>
      </div>
    </div>
  );
};

export default SpecialOffers;
