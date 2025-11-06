import express from 'express';
import {
  generateRecipe,
  getRoomRecipes,
  getRecipeById,
  deleteRecipe,
  generateRecipeFromVoice
} from '../controllers/recipe.controller.js';

const router = express.Router();

// Generate new recipe for a room
router.post('/room/:roomId/generate', generateRecipe);

router.post('/room/:roomId/generate-from-voice', generateRecipeFromVoice);
// Get all recipes for a room
router.get('/room/:roomId', getRoomRecipes);

// Get single recipe by ID
router.get('/:recipeId', getRecipeById);

// Delete recipe
router.delete('/:recipeId', deleteRecipe);

export default router;
