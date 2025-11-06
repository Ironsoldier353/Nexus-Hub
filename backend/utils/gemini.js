import { GoogleGenerativeAI } from '@google/generative-ai';

// Check for API key
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

/**
 * Generate a recipe using Gemini AI based on ingredients and preferences
 * @param {Object} recipeSuggestionRequest - Recipe suggestion request
 * @param {Array<string>} recipeSuggestionRequest.ingredients - List of ingredients
 * @param {string} [recipeSuggestionRequest.dietaryRestrictions] - Dietary restrictions
 * @param {string} [recipeSuggestionRequest.cuisinePreference] - Cuisine preference
 * @param {string} [recipeSuggestionRequest.difficultLevel] - Difficulty level
 * @returns {Promise<Object>} Generated recipe
 */
export async function generateRecipe(recipeSuggestionRequest) {
  try {
    // Extract info from request
    const { ingredients, dietaryRestrictions, cuisinePreference, difficultyLevel } = recipeSuggestionRequest;
    
    // Create prompt for Gemini
    let prompt = `Generate a detailed recipe using only these ingredients: ${ingredients.join(', ')}.\n\n`;
    
    if (dietaryRestrictions) {
      prompt += `Dietary restrictions: ${dietaryRestrictions}.\n`;
    }
    
    if (cuisinePreference) {
      prompt += `Preferred cuisine: ${cuisinePreference}.\n`;
    }
    
    if (difficultyLevel) {
      prompt += `Difficulty level: ${difficultyLevel}.\n`;
    }
    
    prompt += `
Please format the response as a structured JSON object with the following fields:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "cuisine": "Cuisine type",
  "difficulty": "easy/medium/hard",
  "prepTime": preparation time in minutes (number),
  "cookTime": cooking time in minutes (number),
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"...],
  "instructions": ["step 1", "step 2"...],
  "tags": ["tag1", "tag2"...],
  "nutritionalInfo": {
    "calories": approximate calories per serving (number),
    "protein": grams of protein (number),
    "carbs": grams of carbohydrates (number),
    "fat": grams of fat (number)
  }
}

Use only ingredients provided. Include cooking methods, temperatures, and times.`;

    // Initialize the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response text
    // Need to extract JSON if it's wrapped in code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    const jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|```\n|```/g, '') : text;
    
    try {
      // Parse the JSON
      const recipe = JSON.parse(jsonString);
      
      // Validate that we have the minimum required fields
      if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
        throw new Error('Generated recipe is missing required fields');
      }
      
      return recipe;
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    throw error;
  }
}