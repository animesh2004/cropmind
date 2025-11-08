# Kaggle Crop Dataset Analysis

## Dataset Found

**Most Popular Dataset:**
- **Name:** Crop Recommendation Dataset
- **Owner:** atharvaingle
- **Ref:** atharvaingle/crop-recommendation-dataset
- **Downloads:** 78,248
- **Size:** 65,234 bytes

## Crops Available in Crop Recommendation Datasets

Based on analysis of popular crop recommendation datasets on Kaggle, here are the crops typically included:

### Complete Crop List (22 Crops)

1. **Rice** - Cereal crop, requires high moisture (60-80%), warm temperature (20-35°C)
2. **Wheat** - Cereal crop, moderate moisture (50-70%), cool temperature (12-25°C)
3. **Maize/Corn** - Cereal crop, moderate moisture (50-70%), warm temperature (15-30°C)
4. **Chickpea** - Pulse crop, low moisture (40-60%), moderate temperature (20-30°C)
5. **Kidney Beans** - Pulse crop, moderate moisture (50-70%), warm temperature (20-30°C)
6. **Pigeon Pea** - Pulse crop, moderate moisture (50-70%), warm temperature (20-30°C)
7. **Moth Beans** - Pulse crop, low moisture (40-60%), warm temperature (20-30°C)
8. **Mung Bean** - Pulse crop, moderate moisture (50-70%), warm temperature (20-30°C)
9. **Black Gram** - Pulse crop, moderate moisture (50-70%), warm temperature (20-30°C)
10. **Lentil** - Pulse crop, low moisture (40-60%), cool temperature (15-25°C)
11. **Pomegranate** - Fruit crop, moderate moisture (50-70%), warm temperature (20-30°C)
12. **Banana** - Fruit crop, high moisture (60-80%), warm temperature (25-35°C)
13. **Mango** - Fruit crop, moderate moisture (50-70%), warm temperature (25-35°C)
14. **Grapes** - Fruit crop, moderate moisture (50-70%), warm temperature (20-30°C)
15. **Watermelon** - Fruit crop, high moisture (60-80%), warm temperature (25-35°C)
16. **Muskmelon** - Fruit crop, moderate moisture (50-70%), warm temperature (25-35°C)
17. **Apple** - Fruit crop, moderate moisture (50-70%), cool temperature (10-20°C)
18. **Orange** - Fruit crop, moderate moisture (50-70%), warm temperature (20-30°C)
19. **Papaya** - Fruit crop, moderate moisture (50-70%), warm temperature (25-35°C)
20. **Coconut** - Fruit crop, high moisture (60-80%), warm temperature (25-35°C)
21. **Cotton** - Cash crop, moderate moisture (50-70%), warm temperature (21-30°C)
22. **Jute** - Cash crop, high moisture (60-80%), warm temperature (25-35°C)
23. **Coffee** - Cash crop, moderate moisture (50-70%), cool temperature (15-25°C)

### Additional Crops (from other datasets)

24. **Soybean** - Oilseed crop, moderate moisture (50-70%), warm temperature (20-30°C)
25. **Groundnut/Peanut** - Oilseed crop, moderate moisture (50-70%), warm temperature (25-30°C)
26. **Sunflower** - Oilseed crop, moderate moisture (50-70%), warm temperature (20-30°C)
27. **Tomato** - Vegetable crop, high moisture (60-80%), moderate temperature (18-25°C)
28. **Potato** - Vegetable crop, high moisture (60-80%), cool temperature (15-20°C)
29. **Onion** - Vegetable crop, moderate moisture (50-70%), moderate temperature (15-25°C)
30. **Cabbage** - Vegetable crop, high moisture (60-80%), cool temperature (10-20°C)
31. **Cauliflower** - Vegetable crop, high moisture (60-80%), cool temperature (10-20°C)
32. **Sugarcane** - Cash crop, very high moisture (70-85%), warm temperature (26-32°C)
33. **Barley** - Cereal crop, moderate moisture (50-70%), cool temperature (10-20°C)
34. **Oats** - Cereal crop, moderate moisture (50-70%), cool temperature (10-20°C)

## Dataset Structure

Crop recommendation datasets typically include:
- **N (Nitrogen)** - Soil nitrogen content
- **P (Phosphorus)** - Soil phosphorus content
- **K (Potassium)** - Soil potassium content
- **Temperature** - Average temperature (°C)
- **Humidity** - Average humidity (%)
- **pH** - Soil pH level
- **Rainfall** - Average rainfall (mm)
- **Label/Crop** - Crop name (target variable)

## How to Access

1. **Via Kaggle API:**
   ```bash
   kaggle datasets download atharvaingle/crop-recommendation-dataset
   ```

2. **Via Kaggle Website:**
   - Visit: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
   - Download the dataset files

3. **Via Python:**
   ```python
   import kaggle
   kaggle.api.dataset_download_files('atharvaingle/crop-recommendation-dataset', unzip=True)
   ```

## Integration with CropMind

To integrate these crops into CropMind:
1. Download the dataset
2. Extract crop information
3. Update the crop recommendation logic in `components/sections/personalized-recommendations.tsx`
4. Add all 22+ crops to the crop selection algorithm

