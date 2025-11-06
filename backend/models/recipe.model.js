import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  cuisine: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  prepTime: {
    type: Number, // in minutes
    required: true
  },
  cookTime: {
    type: Number, // in minutes
    required: true
  },
  totalTime: {
    type: Number, // in minutes
    required: true
  },
  servings: {
    type: Number,
    required: true
  },
  calories: {
    type: Number,
    required: true
  },
  ingredients: [{
    item: String,
    quantity: String,
    unit: String
  }],
  instructions: [{
    step: Number,
    description: String
  }],
  tags: [String],
  isRegional: {
    type: Boolean,
    default: false
  },
  region: String,
  dietaryInfo: {
    isVegetarian: Boolean,
    isVegan: Boolean,
    isGlutenFree: Boolean,
    isDairyFree: Boolean
  },
  nutritionInfo: {
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  }
}, {
  timestamps: true
});

export const Recipe = mongoose.model('Recipe', recipeSchema);