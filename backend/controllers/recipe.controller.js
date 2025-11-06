import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../models/recipe.model.js';
import { Room } from '../models/room.model.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });
const API_KEY_1 = process.env.GEMINI_API_KEY?.trim();
const MODEL_1 = 'gemini-2.5-flash';
const genAI = new GoogleGenerativeAI(API_KEY_1);

// Helper function to create prompt
const createRecipePrompt = (recipeData) => {
  const {
    calories,
    ingredients,
    cuisine,
    difficulty,
    prepTime,
    isRegional,
    region,
    dietaryRestrictions,
    servings,
    mealType,
    spiceLevel
  } = recipeData;

  let prompt = `Generate a detailed recipe with the following specifications:\n\n`;

  if (cuisine) prompt += `Cuisine: ${cuisine}\n`;
  if (difficulty) prompt += `Difficulty Level: ${difficulty}\n`;
  if (prepTime) prompt += `Maximum Prep Time: ${prepTime} minutes\n`;
  if (calories) prompt += `Target Calories: approximately ${calories} kcal per serving\n`;
  if (servings) prompt += `Servings: ${servings}\n`;
  if (ingredients && ingredients.length > 0) {
    prompt += `Must include ingredients: ${ingredients.join(', ')}\n`;
  }
  if (isRegional && region) {
    prompt += `Regional Variation: ${region}\n`;
  }
  if (dietaryRestrictions && dietaryRestrictions.length > 0) {
    prompt += `Dietary Restrictions: ${dietaryRestrictions.join(', ')}\n`;
  }
  if (mealType) prompt += `Meal Type: ${mealType}\n`;
  if (spiceLevel) prompt += `Spice Level: ${spiceLevel}\n`;

  prompt += `\nProvide the recipe in the following JSON format (ensure it's valid JSON):
{
  "name": "Recipe name",
  "description": "Brief description",
  "cuisine": "${cuisine || 'International'}",
  "difficulty": "${difficulty || 'medium'}",
  "prepTime": number (in minutes),
  "cookTime": number (in minutes),
  "totalTime": number (in minutes),
  "servings": ${servings || 4},
  "calories": number (per serving),
  "ingredients": [
    {"item": "ingredient name", "quantity": "amount", "unit": "measurement"}
  ],
  "instructions": [
    {"step": 1, "description": "detailed instruction"}
  ],
  "tags": ["tag1", "tag2"],
  "isRegional": ${isRegional || false},
  "region": "${region || ''}",
  "dietaryInfo": {
    "isVegetarian": boolean,
    "isVegan": boolean,
    "isGlutenFree": boolean,
    "isDairyFree": boolean
  },
  "nutritionInfo": {
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "fiber": number (grams)
  }
}

Provide ONLY the JSON object, no additional text.`;

  return prompt;
};

// Generate recipe using Gemini
export const generateRecipe = async (req, res) => {
  try {
    const { roomId } = req.params;
    const recipeData = req.body;
    

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Create prompt
    const prompt = createRecipePrompt(recipeData);

    // Generate recipe with Gemini
    const model = genAI.getGenerativeModel({ model: MODEL_1 });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response to extract JSON
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const recipeJson = JSON.parse(text);

    // Create recipe in database
    const newRecipe = new Recipe({
      ...recipeJson,
      room: roomId,
      createdBy: req.user?.id || room.admin // Assuming you have user auth
    });

    await newRecipe.save();

    // Add recipe to room
    room.recipes.push(newRecipe._id);
    await room.save();

    res.status(201).json({
      success: true,
      message: 'Recipe generated and saved successfully',
      recipe: newRecipe
    });

  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({
      error: 'Failed to generate recipe',
      details: error.message
    });
  }
};

export const generateRecipeFromVoice = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { voiceInput } = req.body;

    if (!voiceInput || voiceInput.trim() === '') {
      return res.status(400).json({ success: false, error: 'Voice input is required' });
    }

    // ✅ Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // ✅ Create prompt based on voice input
    const prompt = `
You are a professional chef. Based on the following voice description, generate a detailed and valid JSON recipe:

Voice Description:
"${voiceInput}"

Provide ONLY a valid JSON object in this format:
{
  "name": "Recipe name",
  "description": "Brief description",
  "cuisine": "Cuisine type",
  "difficulty": "easy | medium | hard",
  "prepTime": number (in minutes),
  "cookTime": number (in minutes),
  "totalTime": number (in minutes),
  "servings": number,
  "calories": number,
  "ingredients": [
    {"item": "ingredient name", "quantity": "amount", "unit": "measurement"}
  ],
  "instructions": [
    {"step": 1, "description": "detailed instruction"}
  ],
  "tags": ["tag1", "tag2"],
  "isRegional": boolean,
  "region": "region name or empty string",
  "dietaryInfo": {
    "isVegetarian": boolean,
    "isVegan": boolean,
    "isGlutenFree": boolean,
    "isDairyFree": boolean
  },
  "nutritionInfo": {
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "fiber": number (grams)
  }
}

Ensure it is valid JSON and contains realistic values.
`;

    // ✅ Generate with Gemini
    const model = genAI.getGenerativeModel({ model: MODEL_1 });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // ✅ Clean and parse JSON
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const recipeJson = JSON.parse(text);

    // ✅ Save to DB
    const newRecipe = new Recipe({
      ...recipeJson,
      room: roomId,
      createdBy: req.user?.id || room.admin,
    });

    await newRecipe.save();

    // ✅ Add to room
    room.recipes.push(newRecipe._id);
    await room.save();

    res.status(201).json({
      success: true,
      message: 'Recipe generated from voice successfully',
      recipe: newRecipe
    });

  } catch (error) {
    console.error('Error generating recipe from voice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recipe from voice',
      details: error.message
    });
  }
};


// Get all recipes for a room
export const getRoomRecipes = async (req, res) => {
  try {
    const { roomId } = req.params;

    const recipes = await Recipe.find({ room: roomId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: recipes.length,
      recipes
    });

  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      error: 'Failed to fetch recipes',
      details: error.message
    });
  }
};

// Get single recipe
export const getRecipeById = async (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId)
      .populate('createdBy', 'name email')
      .populate('room');

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.status(200).json({
      success: true,
      recipe
    });

  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      error: 'Failed to fetch recipe',
      details: error.message
    });
  }
};

// Delete recipe
export const deleteRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Remove recipe from room
    await Room.findByIdAndUpdate(
      recipe.room,
      { $pull: { recipes: recipeId } }
    );

    await Recipe.findByIdAndDelete(recipeId);

    res.status(200).json({
      success: true,
      message: 'Recipe deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      error: 'Failed to delete recipe',
      details: error.message
    });
  }
};
