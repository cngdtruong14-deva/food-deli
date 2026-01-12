export class SmartRecipeAnalyzer {
  constructor() {
    this.ingredients = this.loadComprehensiveIngredients();
    this.categories = this.loadDishCategories();
  }

  // ==========================================
  // 1. DATA: COMPREHENSIVE INGREDIENTS (~200 items)
  // ==========================================
  loadComprehensiveIngredients() {
    return {
      // --- THỊT (MEAT) ---
      'thịt bò mỹ': { category: 'meat', unit: 'kg', avgPrice: 280000, keywords: ['bò mỹ', 'ba chỉ bò'] },
      'thịt bò ta': { category: 'meat', unit: 'kg', avgPrice: 250000, keywords: ['bò ta', 'thịt bò'] },
      'bắp bò': { category: 'meat', unit: 'kg', avgPrice: 270000, keywords: ['bắp bò'] },
      'gân bò': { category: 'meat', unit: 'kg', avgPrice: 180000, keywords: ['gân bò'] },
      'đuôi bò': { category: 'meat', unit: 'kg', avgPrice: 220000, keywords: ['đuôi bò'] },
      'thịt heo ba chỉ': { category: 'meat', unit: 'kg', avgPrice: 150000, keywords: ['heo', 'ba chỉ', 'lợn'] },
      'thịt heo nạc vai': { category: 'meat', unit: 'kg', avgPrice: 130000, keywords: ['nạc vai'] },
      'sườn heo': { category: 'meat', unit: 'kg', avgPrice: 160000, keywords: ['sườn'] },
      'thịt dải heo': { category: 'meat', unit: 'kg', avgPrice: 180000, keywords: ['dải heo', 'dải'] },
      'nầm heo': { category: 'meat', unit: 'kg', avgPrice: 200000, keywords: ['nầm'] },
      'thịt gà ta': { category: 'meat', unit: 'kg', avgPrice: 130000, keywords: ['gà ta', 'gà chạy bộ'] },
      'thịt gà công nghiệp': { category: 'meat', unit: 'kg', avgPrice: 70000, keywords: ['gà', 'đùi gà'] },
      'gà đen hmong': { category: 'meat', unit: 'kg', avgPrice: 220000, keywords: ['gà đen', 'gà hmong'] },
      'chân gà': { category: 'meat', unit: 'kg', avgPrice: 80000, keywords: ['chân gà'] },
      'sụn gà': { category: 'meat', unit: 'kg', avgPrice: 150000, keywords: ['sụn gà'] },
      'cánh gà': { category: 'meat', unit: 'kg', avgPrice: 90000, keywords: ['cánh gà'] },
      'thịt dê tươi': { category: 'meat', unit: 'kg', avgPrice: 350000, keywords: ['dê'] },
      'dồi dê': { category: 'meat', unit: 'kg', avgPrice: 180000, keywords: ['dồi dê'] },
      'thịt trâu': { category: 'meat', unit: 'kg', avgPrice: 270000, keywords: ['trâu'] },
      'ếch đồng': { category: 'meat', unit: 'kg', avgPrice: 120000, keywords: ['ếch'] },
      'lợn mán': { category: 'meat', unit: 'kg', avgPrice: 220000, keywords: ['lợn mán'] },
      'vịt': { category: 'meat', unit: 'kg', avgPrice: 80000, keywords: ['vịt'] },
      'chim câu': { category: 'meat', unit: 'con', avgPrice: 70000, keywords: ['chim', 'bồ câu'] },

      // --- HẢI SẢN (SEAFOOD) ---
      'tôm sú': { category: 'seafood', unit: 'kg', avgPrice: 350000, keywords: ['tôm sú', 'tôm'] },
      'tôm hùm': { category: 'seafood', unit: 'kg', avgPrice: 1200000, keywords: ['tôm hùm'] },
      'mực ống': { category: 'seafood', unit: 'kg', avgPrice: 280000, keywords: ['mực ống', 'mực'] },
      'mực trứng': { category: 'seafood', unit: 'kg', avgPrice: 320000, keywords: ['mực trứng'] },
      'mực khô': { category: 'seafood', unit: 'kg', avgPrice: 900000, keywords: ['mực khô'] },
      'râu mực': { category: 'seafood', unit: 'kg', avgPrice: 220000, keywords: ['râu mực'] },
      'bạch tuộc': { category: 'seafood', unit: 'kg', avgPrice: 180000, keywords: ['bạch tuộc'] },
      'cá chẽm': { category: 'seafood', unit: 'kg', avgPrice: 180000, keywords: ['cá chẽm'] },
      'cá diêu hồng': { category: 'seafood', unit: 'kg', avgPrice: 60000, keywords: ['cá diêu hồng'] },
      'cá quả': { category: 'seafood', unit: 'kg', avgPrice: 110000, keywords: ['cá quả', 'cá lóc'] },
      'cá chép giòn': { category: 'seafood', unit: 'kg', avgPrice: 160000, keywords: ['cá chép'] },
      'cá hồi': { category: 'seafood', unit: 'kg', avgPrice: 450000, keywords: ['cá hồi'] },
      'cá lăng': { category: 'seafood', unit: 'kg', avgPrice: 150000, keywords: ['cá lăng'] },
      'cá tầm': { category: 'seafood', unit: 'kg', avgPrice: 300000, keywords: ['cá tầm'] },
      'ốc hương': { category: 'seafood', unit: 'kg', avgPrice: 420000, keywords: ['ốc hương'] },
      'ốc móng tay': { category: 'seafood', unit: 'kg', avgPrice: 150000, keywords: ['ốc móng tay'] },
      'ngao/ngheu': { category: 'seafood', unit: 'kg', avgPrice: 30000, keywords: ['ngao', 'nghêu'] },
      'hàu': { category: 'seafood', unit: 'kg', avgPrice: 50000, keywords: ['hàu'] },
      'sứa': { category: 'seafood', unit: 'kg', avgPrice: 80000, keywords: ['sứa'] },
      'cua đồng': { category: 'seafood', unit: 'kg', avgPrice: 180000, keywords: ['cua đồng', 'riêu cua'] },
      'ghẹ': { category: 'seafood', unit: 'kg', avgPrice: 350000, keywords: ['ghẹ'] },

      // --- RAU CỦ (VEGETABLES) ---
      'rau muống': { category: 'vegetable', unit: 'kg', avgPrice: 15000, keywords: ['rau muống'] },
      'cải thảo': { category: 'vegetable', unit: 'kg', avgPrice: 20000, keywords: ['cải thảo'] },
      'cải thìa': { category: 'vegetable', unit: 'kg', avgPrice: 25000, keywords: ['cải thìa'] },
      'cải mèo': { category: 'vegetable', unit: 'kg', avgPrice: 30000, keywords: ['cải mèo'] },
      'cải bắp': { category: 'vegetable', unit: 'kg', avgPrice: 15000, keywords: ['cải bắp'] },
      'rau bò khai': { category: 'vegetable', unit: 'kg', avgPrice: 45000, keywords: ['bò khai'] },
      'rau ngót lào': { category: 'vegetable', unit: 'kg', avgPrice: 40000, keywords: ['ngót lào'] },
      'su hào': { category: 'vegetable', unit: 'kg', avgPrice: 15000, keywords: ['su hào'] },
      'khoai tây': { category: 'vegetable', unit: 'kg', avgPrice: 20000, keywords: ['khoai tây'] },
      'ngô ngọt': { category: 'vegetable', unit: 'kg', avgPrice: 25000, keywords: ['ngô'] },
      'khoai lang': { category: 'vegetable', unit: 'kg', avgPrice: 20000, keywords: ['khoai lang'] },
      'cà chua': { category: 'vegetable', unit: 'kg', avgPrice: 25000, keywords: ['cà chua'] },
      'dưa chuột': { category: 'vegetable', unit: 'kg', avgPrice: 15000, keywords: ['dưa chuột'] },
      'xà lách': { category: 'vegetable', unit: 'kg', avgPrice: 30000, keywords: ['xà lách', 'salad'] },
      'rau thơm': { category: 'vegetable', unit: 'kg', avgPrice: 50000, keywords: ['rau thơm', 'húng'] },
      'hành tây': { category: 'vegetable', unit: 'kg', avgPrice: 20000, keywords: ['hành tây'] },
      'cà rốt': { category: 'vegetable', unit: 'kg', avgPrice: 15000, keywords: ['cà rốt'] },
      'nấm kim châm': { category: 'vegetable', unit: 'kg', avgPrice: 40000, keywords: ['nấm kim'] },
      'nấm đùi gà': { category: 'vegetable', unit: 'kg', avgPrice: 60000, keywords: ['nấm đùi gà'] },
      'nấm hương': { category: 'vegetable', unit: 'kg', avgPrice: 250000, keywords: ['nấm hương'] },
      'măng tươi': { category: 'vegetable', unit: 'kg', avgPrice: 30000, keywords: ['măng'] },
      'hoa chuối': { category: 'vegetable', unit: 'kg', avgPrice: 20000, keywords: ['hoa chuối'] },
      'đậu bắp': { category: 'vegetable', unit: 'kg', avgPrice: 30000, keywords: ['đậu bắp'] },
      'xoài xanh': { category: 'vegetable', unit: 'kg', avgPrice: 25000, keywords: ['xoài'] },
      'khổ qua': { category: 'vegetable', unit: 'kg', avgPrice: 25000, keywords: ['khổ qua', 'mướp đắng'] },
      // Gia vị tươi
      'tỏi': { category: 'spice', unit: 'kg', avgPrice: 40000, keywords: ['tỏi'] },
      'ớt': { category: 'spice', unit: 'kg', avgPrice: 50000, keywords: ['ớt'] },
      'gừng': { category: 'spice', unit: 'kg', avgPrice: 30000, keywords: ['gừng'] },
      'sả': { category: 'spice', unit: 'kg', avgPrice: 20000, keywords: ['sả'] },
      'chanh': { category: 'spice', unit: 'kg', avgPrice: 25000, keywords: ['chanh'] },
      'hành tím': { category: 'spice', unit: 'kg', avgPrice: 50000, keywords: ['hành tím'] },
      'riềng': { category: 'spice', unit: 'kg', avgPrice: 20000, keywords: ['riềng'] },
      'mẻ': { category: 'spice', unit: 'kg', avgPrice: 15000, keywords: ['mẻ'] },

      // --- KHÔ / GIA VỊ (DRY/SPICE) ---
      'gạo thơm': { category: 'dry', unit: 'kg', avgPrice: 22000, keywords: ['gạo', 'cơm'] },
      'bún tươi': { category: 'dry', unit: 'kg', avgPrice: 12000, keywords: ['bún'] },
      'miến dong': { category: 'dry', unit: 'kg', avgPrice: 60000, keywords: ['miến'] },
      'mì trứng': { category: 'dry', unit: 'kg', avgPrice: 40000, keywords: ['mì', 'mỳ'] },
      'bánh đa': { category: 'dry', unit: 'kg', avgPrice: 30000, keywords: ['bánh đa'] },
      'dầu ăn': { category: 'oil', unit: 'liter', avgPrice: 40000, keywords: [] },
      'nước mắm': { category: 'spice', unit: 'liter', avgPrice: 80000, keywords: [] },
      'hạt nêm': { category: 'spice', unit: 'kg', avgPrice: 60000, keywords: [] },
      'mì chính': { category: 'spice', unit: 'kg', avgPrice: 50000, keywords: [] },
      'đường': { category: 'spice', unit: 'kg', avgPrice: 20000, keywords: [] },
      'tiêu xay': { category: 'spice', unit: 'kg', avgPrice: 200000, keywords: ['tiêu'] },
      'ngũ vị hương': { category: 'spice', unit: 'gói', avgPrice: 5000, keywords: [] },
      'bột chiên giòn': { category: 'dry', unit: 'kg', avgPrice: 40000, keywords: [] },
      'thính gạo': { category: 'dry', unit: 'kg', avgPrice: 50000, keywords: ['thính'] },
      'lạc rang': { category: 'dry', unit: 'kg', avgPrice: 60000, keywords: ['lạc', 'đậu phộng'] },
      'đậu phụ': { category: 'fresh', unit: 'kg', avgPrice: 20000, keywords: ['đậu', 'đậu hũ'] },
      'trứng gà': { category: 'fresh', unit: 'quả', avgPrice: 3500, keywords: ['trứng'] },
      'phomai': { category: 'dairy', unit: 'kg', avgPrice: 250000, keywords: ['phomai', 'cheese'] },

      // --- SỐT (SAUCE) ---
      'sốt thái': { category: 'sauce', unit: 'liter', avgPrice: 120000, keywords: ['thái', 'sốt thái'] },
      'sốt me': { category: 'sauce', unit: 'liter', avgPrice: 80000, keywords: ['me', 'sốt me'] },
      'sốt trứng muối': { category: 'sauce', unit: 'liter', avgPrice: 180000, keywords: ['hoàng kim', 'trứng muối'] },
      'sốt tiêu đen': { category: 'sauce', unit: 'liter', avgPrice: 120000, keywords: ['tiêu đen'] },
      'sốt bbq': { category: 'sauce', unit: 'liter', avgPrice: 100000, keywords: ['bbq'] },
      'mắm tôm': { category: 'sauce', unit: 'liter', avgPrice: 60000, keywords: ['mắm tôm'] },
      'tương ớt': { category: 'sauce', unit: 'liter', avgPrice: 40000, keywords: [] },
      'wasabi': { category: 'sauce', unit: 'tuýp', avgPrice: 60000, keywords: ['wasabi', 'mù tạt'] },

      // --- ĐỒ UỐNG (DRINKS) ---
      'bia tiger': { category: 'drink', unit: 'bottle', avgPrice: 16000, keywords: ['tiger'] },
      'bia heineken': { category: 'drink', unit: 'bottle', avgPrice: 19000, keywords: ['heineken'] },
      'bia hà nội': { category: 'drink', unit: 'bottle', avgPrice: 12000, keywords: ['hà nội'] },
      'bia sài gòn': { category: 'drink', unit: 'bottle', avgPrice: 13000, keywords: ['sài gòn'] },
      'coca cola': { category: 'drink', unit: 'can', avgPrice: 9000, keywords: ['coca'] },
      'pepsi': { category: 'drink', unit: 'can', avgPrice: 9000, keywords: ['pepsi'] },
      'nước suối': { category: 'drink', unit: 'bottle', avgPrice: 6000, keywords: ['nước suối', 'lavie', 'aquafina'] },
      'trà': { category: 'drink', unit: 'liter', avgPrice: 30000, keywords: ['trà'] },
      'rượu': { category: 'drink', unit: 'liter', avgPrice: 100000, keywords: ['rượu'] }
    };
  }

  loadDishCategories() {
    return {
      'lẩu': { type: 'hotpot', portionScale: 0.5, needs: ['broth', 'veg', 'carb', 'dip'] },
      'nướng': { type: 'bbq', portionScale: 0.4, needs: ['marinade', 'wrap', 'dip'] },
      'xào': { type: 'stirfry', portionScale: 0.3, needs: ['oil', 'aromatics', 'veg'] },
      'chiên': { type: 'fried', portionScale: 0.3, needs: ['oil', 'batter', 'dip'] },
      'hấp': { type: 'steam', portionScale: 0.4, needs: ['aromatics', 'dip'] },
      'luộc': { type: 'boil', portionScale: 0.4, needs: ['dip'] },
      'gỏi': { type: 'salad', portionScale: 0.25, needs: ['dressing', 'herbs', 'crunch'] },
      'nộm': { type: 'salad', portionScale: 0.25, needs: ['dressing', 'herbs', 'crunch'] },
      'salad': { type: 'salad', portionScale: 0.25, needs: ['dressing'] },
      'cơm': { type: 'carb', portionScale: 0.3, needs: ['rice'] },
      'mì': { type: 'carb', portionScale: 0.3, needs: ['noodle'] },
      'miến': { type: 'carb', portionScale: 0.3, needs: ['noodle'] },
      'cháo': { type: 'carb', portionScale: 0.2, needs: ['rice'] },
      'bia': { type: 'drink', portionScale: 1, needs: [] },
      'nước': { type: 'drink', portionScale: 1, needs: [] },
      'trà': { type: 'drink', portionScale: 1, needs: [] },
      'combo': { type: 'combo', portionScale: 2, needs: [] }
    };
  }

  // ==========================================
  // 2. LOGIC: ANALYSIS & MATCHING
  // ==========================================
  
  findIngredientsByKeywords(text) {
    const textLower = text.toLowerCase();
    const matches = [];

    for (const [key, data] of Object.entries(this.ingredients)) {
      if (data.keywords && data.keywords.some(k => textLower.includes(k))) {
        // Boost priority for exact match or longer match
        const relevance = textLower === key ? 2 : 1;
        matches.push({ name: key, ...data, relevance });
      }
    }

    // Sort by length of matching keyword (descending) to prefer specific matches
    // e.g. "thịt bò mỹ" matches longer keyword than "thịt bò"
    return matches.sort((a, b) => b.name.length - a.name.length);
  }

  classifyDish(dishName) {
    const name = dishName.toLowerCase();
    
    // Check specific categories first
    for (const [key, config] of Object.entries(this.categories)) {
      if (name.includes(key)) return { name: key, ...config };
    }
    
    // Default fallback based on ingredient detection
    if (this.findIngredientsByKeywords(name).some(i => i.category === 'drink')) {
      return { name: 'nước', type: 'drink', portionScale: 1, needs: [] };
    }

    return { name: 'món khác', type: 'general', portionScale: 0.3, needs: ['spice'] };
  }

  // ==========================================
  // 3. RECIPE GENERATION
  // ==========================================

  analyzeDishByName(dishName) {
    const category = this.classifyDish(dishName);
    const nameLower = dishName.toLowerCase();
    
    // 1. Detect Explicit Ingredients from Name
    let detectedIngredients = this.findIngredientsByKeywords(nameLower);
    
    // Filter out redundant subset matches (e.g. if 'thịt bò mỹ' found, ignore 'thịt bò')
    detectedIngredients = this.filterRedundantIngredients(detectedIngredients);

    // 2. Add Implicit/Side Ingredients based on Category
    const sideIngredients = this.getSideIngredients(category, detectedIngredients, nameLower);

    return {
      dishName,
      category,
      mainIngredients: detectedIngredients,
      sideIngredients: sideIngredients
    };
  }

  filterRedundantIngredients(ingredients) {
    if (ingredients.length <= 1) return ingredients;
    const filtered = [];
    const sorted = ingredients.sort((a, b) => b.name.length - a.name.length); // Longest first

    for (const ing of sorted) {
      // If this ingredient is not already covered by a selected ingredient
      // (simplistic check: string inclusion)
      if (!filtered.some(f => f.name.includes(ing.name) && f.name !== ing.name)) {
        filtered.push(ing);
      }
    }
    return filtered;
  }

  getSideIngredients(category, detectedIngredients, nameLower) {
    const sides = [];
    
    // Standard Base for all savory dishes
    if (category.type !== 'drink' && category.type !== 'combo') {
      sides.push(this.ingredients['dầu ăn']);
      sides.push(this.ingredients['mì chính']);
      sides.push(this.ingredients['nước mắm']);
      sides.push(this.ingredients['tỏi']); // Most dishes use garlic
    }

    // Category Specifics
    switch (category.name) {
      case 'lẩu':
        sides.push(this.ingredients['nước xương hầm'] || { name: 'gia vị lẩu', unit: 'gói', avgPrice: 20000 });
        sides.push(this.ingredients['rau muống']);
        sides.push(this.ingredients['nấm kim châm']);
        sides.push(this.ingredients['đậu phụ']);
        sides.push(this.ingredients['bún tươi']);
        sides.push(this.ingredients['mì trứng']);
        break;
      
      case 'nướng':
      case 'bbq':
        sides.push(this.ingredients['sốt bbq']);
        sides.push(this.ingredients['rau xà lách']);
        sides.push(this.ingredients['dưa chuột']);
        sides.push(this.ingredients['sả']);
        break;

      case 'xào':
        sides.push(this.ingredients['hành tây']);
        if (!detectedIngredients.some(i => i.category === 'vegetable')) {
           sides.push(this.ingredients['rau cải ngọt'] || this.ingredients['rau muống']);
        }
        break;

      case 'chiên':
      case 'rán':
        sides.push(this.ingredients['bột chiên giòn']);
        sides.push(this.ingredients['tương ớt']);
        break;
        
      case 'hấp':
        sides.push(this.ingredients['gừng']);
        sides.push(this.ingredients['sả']);
        break;

      case 'gỏi':
      case 'nộm':
      case 'salad':
        sides.push(this.ingredients['lạc rang']);
        sides.push(this.ingredients['rau thơm']);
        sides.push(this.ingredients['nước mắm']);
        sides.push(this.ingredients['chanh']);
        sides.push(this.ingredients['đường']);
        break;

      case 'cơm':
        // If just 'Cơm rang', add egg and rice
        if (!detectedIngredients.some(i => i.name === 'gạo thơm')) sides.push(this.ingredients['gạo thơm']);
        if (nameLower.includes('rang') || nameLower.includes('chiên')) {
          sides.push(this.ingredients['trứng gà']);
          sides.push(this.ingredients['dưa chuột']);
        }
        break;
    }

    // Specific flavor overrides
    if (nameLower.includes('chua cay') || nameLower.includes('thái')) {
       sides.push(this.ingredients['sốt thái'] || this.ingredients['chanh']);
    }
    if (nameLower.includes('hoàng kim') || nameLower.includes('trứng muối')) {
       sides.push(this.ingredients['sốt trứng muối']);
    }
    if (nameLower.includes('me')) {
       sides.push(this.ingredients['sốt me']);
    }

    return sides.filter(i => i); // Remove nulls
  }

  generateRecipe(analysis) {
    const finalIngredients = [];
    const portion = analysis.category.portionScale || 0.3; // Default portion scale

    // Combine Main and Side Ingredients
    const allIngredients = [...analysis.mainIngredients];
    
    // Add side ingredients if they are not already in main
    for (const side of analysis.sideIngredients) {
      if (!allIngredients.some(m => m && m.name === side.name)) {
        allIngredients.push(side);
      }
    }

    // Assign Quantities
    for (const item of allIngredients) {
      if (!item) continue;
      
      let quantity = 0;

      // Base quantity logic
      if (item.category === 'meat' || item.category === 'seafood') {
        quantity = portion; // e.g. 0.5kg for hotpot, 0.3kg for stirfry
      } else if (item.category === 'vegetable') {
        quantity = portion * 0.8; 
      } else if (item.category === 'carb' || item.category === 'dry') {
        quantity = 0.2;
      } else if (item.category === 'sauce') {
        quantity = 0.05; // 50ml
      } else if (item.category === 'spice') {
        quantity = 0.02; // 20g
      } else if (item.category === 'oil') {
        quantity = 0.05;
      } else if (item.category === 'drink') {
        quantity = 1; // 1 bottle/can
      } else if (item.category === 'dairy') {
        quantity = 0.1;
      } else if (item.category === 'fresh') { // Tofu, egg
        quantity = item.unit === 'quả' ? 2 : 0.3;
      } else {
        quantity = 0.1;
      }

      // Combo handling
      if (analysis.category.name === 'combo') {
         quantity = quantity * 3; // Combos are usually larger
      }

      finalIngredients.push({
        ingredientName: item.name,
        category: item.category,
        unit: item.unit,
        quantity: parseFloat(quantity.toFixed(3)),
        costPrice: item.avgPrice
      });
    }

    // Fallback if empty (e.g. unrecognizable dish name)
    if (finalIngredients.length === 0) {
      finalIngredients.push({
        ingredientName: 'thịt heo ba chỉ', // Generic fallback
        category: 'meat',
        unit: 'kg',
        quantity: 0.2,
        costPrice: 150000
      });
      finalIngredients.push({
        ingredientName: 'gia vị tổng hợp',
        category: 'spice',
        unit: 'kg',
        quantity: 0.1,
        costPrice: 50000
      });
    }

    return finalIngredients;
  }
}
