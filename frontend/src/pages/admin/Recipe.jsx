import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ChefHat, Clock, Users, Flame, Trash2, Plus, Loader2, ArrowLeft, Sparkles, Mic, Info, Chrome, AlertCircle } from 'lucide-react';

export default function RecipePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  const [formData, setFormData] = useState({
    calories: '',
    ingredients: '',
    cuisine: '',
    difficulty: 'medium',
    prepTime: '',
    isRegional: false,
    region: '',
    servings: '4',
    dietaryRestrictions: [],
    mealType: '',
    spiceLevel: 'medium'
  });

  const fieldInfo = {
    calories: "Target calorie count for the recipe. Example: 500 for a balanced meal",
    ingredients: "List ingredients separated by commas. Example: chicken, tomatoes, basil, olive oil",
    cuisine: "Type of cuisine you prefer. Example: Italian, Indian, Mexican, Chinese",
    difficulty: "Cooking skill level required: Easy (beginner), Medium (intermediate), Hard (advanced)",
    prepTime: "Estimated preparation and cooking time in minutes. Example: 30 for quick meals",
    servings: "Number of people this recipe will serve. Example: 4 for a family meal",
    region: "Specific regional variation (optional). Example: Tuscan, Punjabi, Sichuan",
    spiceLevel: "Heat level of the dish: Mild (no spice), Medium (moderate heat), Spicy (hot)"
  };

  useEffect(() => {
    fetchRecipes();
  }, [roomId]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://nexus-hub-vvqm.onrender.com/api/v1/recipes/room/${roomId}`);
      const data = await response.json();
      if (data.success) {
        setRecipes(data.recipes);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);

    const payload = {
      ...formData,
      calories: parseInt(formData.calories) || 500,
      prepTime: parseInt(formData.prepTime) || 30,
      servings: parseInt(formData.servings) || 4,
      ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean)
    };

    try {
      const response = await fetch(`https://nexus-hub-vvqm.onrender.com/api/v1/recipes/room/${roomId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setRecipes([data.recipe, ...recipes]);
        setShowForm(false);
        setFormData({
          calories: '',
          ingredients: '',
          cuisine: '',
          difficulty: 'medium',
          prepTime: '',
          isRegional: false,
          region: '',
          servings: '4',
          dietaryRestrictions: [],
          mealType: '',
          spiceLevel: 'medium'
        });
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
    } finally {
      setGenerating(false);
    }
  };

  const deleteRecipe = async (recipeId) => {
    if (!window.confirm('Delete this recipe?')) return;
    
    try {
      const response = await fetch(`https://nexus-hub-vvqm.onrender.com/api/v1/recipes/${recipeId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setRecipes(recipes.filter(r => r._id !== recipeId));
        setSelectedRecipe(null);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceText('Listening... 🎤');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceText(transcript);
      setIsListening(false);
      
      await generateFromVoice(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      let errorMessage = 'Could not recognize speech. ';
      
      switch(event.error) {
        case 'network':
          errorMessage += 'Please check your internet connection and try again.';
          break;
        case 'not-allowed':
        case 'service-not-allowed':
          errorMessage += 'Microphone access denied. Please allow microphone permissions in your browser settings.';
          break;
        case 'no-speech':
          errorMessage += 'No speech detected. Please try speaking again.';
          break;
        case 'aborted':
          errorMessage += 'Speech recognition was aborted.';
          break;
        case 'audio-capture':
          errorMessage += 'No microphone was found. Please connect a microphone.';
          break;
        default:
          errorMessage += 'Please try again.';
      }
      
      setVoiceText(errorMessage);
      alert(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setVoiceText('Failed to start microphone. Please try again.');
      alert('Failed to start microphone. Please make sure you have granted microphone permissions.');
    }
  };

  const generateFromVoice = async (text) => {
    setGenerating(true);
    
    try {
      const response = await fetch(`https://nexus-hub-vvqm.onrender.com/api/v1/recipes/room/${roomId}/generate-from-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceInput: text })
      });

      const data = await response.json();
      if (data.success) {
        setRecipes([data.recipe, ...recipes]);
        setShowVoiceInput(false);
        setVoiceText('');
      }
    } catch (error) {
      console.error('Error generating recipe from voice:', error);
      alert('Failed to generate recipe. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  const InfoTooltip = ({ field }) => (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setActiveTooltip(field)}
        onMouseLeave={() => setActiveTooltip(null)}
        onClick={(e) => {
          e.preventDefault();
          setActiveTooltip(activeTooltip === field ? null : field);
        }}
        className="ml-2 text-orange-400 hover:text-orange-600 transition-colors"
      >
        <Info className="w-4 h-4" />
      </button>
      {activeTooltip === field && (
        <div className="absolute left-0 top-full mt-2 w-64 sm:w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-50 border border-gray-700">
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45 border-l border-t border-gray-700"></div>
          {fieldInfo[field]}
        </div>
      )}
    </div>
  );

  InfoTooltip.propTypes = {
    field: PropTypes.string.isRequired
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2 rounded-xl shadow-lg">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Nexus-Hub
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Recipe Collection</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate(`/admin/dashboard/${roomId}`)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition shadow-sm text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
              <button
                onClick={() => setShowVoiceInput(!showVoiceInput)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition shadow-lg text-sm sm:text-base whitespace-nowrap"
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Voice Search</span>
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition shadow-lg text-sm sm:text-base whitespace-nowrap"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Manual Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {showVoiceInput && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-purple-200">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Mic className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Voice Recipe Generation</h2>
            </div>

            {/* Important Instructions */}
            <div className="bg-white/80 rounded-xl p-4 mb-6 border border-purple-200">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-2">Important Instructions</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Chrome className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-500" />
                      <span><strong>Browser Compatibility:</strong> Use Chrome, Edge, or Safari for best results. Voice recognition may not work in all browsers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Mic className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-500" />
                      <span><strong>Microphone Permission:</strong> Allow microphone access when prompted by your browser.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-500" />
                      <span><strong>Be Descriptive:</strong> Explain your recipe requirements in detail. Include cuisine type, ingredients, dietary preferences, difficulty level, and calorie range for best results.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="text-center py-6 sm:py-8">
              <div className="mb-6">
                <button
                  onClick={startVoiceRecognition}
                  disabled={isListening || generating}
                  className={`mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                    isListening 
                      ? 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-600 hover:scale-110'
                  } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </button>
              </div>
              
              <p className="text-gray-700 mb-4 font-medium text-sm sm:text-base">
                {isListening ? '🎤 Listening... Speak now!' : 'Click the microphone to start'}
              </p>
              
              {voiceText && !isListening && (
                <div className={`rounded-xl p-4 shadow-md border max-w-2xl mx-auto ${
                  voiceText.includes('Error') || voiceText.includes('Could not') || voiceText.includes('Failed')
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-purple-200'
                }`}>
                  <p className="text-sm text-gray-500 mb-2">
                    {voiceText.includes('Error') || voiceText.includes('Could not') || voiceText.includes('Failed')
                      ? '⚠️ Error:'
                      : 'You said:'}
                  </p>
                  <p className={`text-base sm:text-lg ${
                    voiceText.includes('Error') || voiceText.includes('Could not') || voiceText.includes('Failed')
                      ? 'text-red-700'
                      : 'text-gray-800'
                  }`}>{voiceText}</p>
                </div>
              )}
              
              {generating && (
                <div className="mt-6 flex items-center justify-center gap-2 text-purple-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-medium text-sm sm:text-base">Generating your recipe...</span>
                </div>
              )}
              
              <div className="mt-6 text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                <p className="mb-2 font-semibold text-purple-900">💡 Example Voice Command:</p>
                <p className="italic text-gray-700">&quot;I want a healthy Italian pasta dish with chicken and vegetables, around 500 calories, medium difficulty, serves 4 people&quot;</p>
              </div>
              
              <button
                onClick={() => {
                  setShowVoiceInput(false);
                  setVoiceText('');
                }}
                className="mt-6 px-6 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-orange-100">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Generate New Recipe</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Calories */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Calories
                    <InfoTooltip field="calories" />
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.calories}
                    onChange={(e) => setFormData({...formData, calories: e.target.value})}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white text-sm sm:text-base"
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Ingredients
                    <InfoTooltip field="ingredients" />
                  </label>
                  <input
                    type="text"
                    placeholder="chicken, tomatoes, basil"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white text-sm sm:text-base"
                  />
                </div>

                {/* Cuisine */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                    <InfoTooltip field="cuisine" />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Italian, Indian"
                    value={formData.cuisine}
                    onChange={(e) => setFormData({...formData, cuisine: e.target.value})}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white text-sm sm:text-base"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                    <InfoTooltip field="difficulty" />
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white text-sm sm:text-base"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Prep Time */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Prep Time (minutes)
                    <InfoTooltip field="prepTime" />
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 30"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({...formData, prepTime: e.target.value})}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white text-sm sm:text-base"
                  />
                </div>

                {/* Servings */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Number of Servings
                    <InfoTooltip field="servings" />
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 4"
                    value={formData.servings}
                    onChange={(e) => setFormData({...formData, servings: e.target.value})}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white text-sm sm:text-base"
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Region (Optional)
                    <InfoTooltip field="region" />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Tuscan, Punjabi"
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value, isRegional: !!e.target.value})}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white text-sm sm:text-base"
                  />
                </div>

                {/* Spice Level */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Spice Level
                    <InfoTooltip field="spiceLevel" />
                  </label>
                  <select
                    value={formData.spiceLevel}
                    onChange={(e) => setFormData({...formData, spiceLevel: e.target.value})}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white text-sm sm:text-base"
                  >
                    <option value="mild">Mild</option>
                    <option value="medium">Medium Spice</option>
                    <option value="spicy">Spicy</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:from-orange-600 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-500 transition shadow-lg flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Recipe
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 sm:p-8 max-w-md mx-auto border border-orange-100">
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No recipes yet</h3>
              <p className="text-sm sm:text-base text-gray-600">Generate your first recipe to get started!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe._id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`bg-white/90 backdrop-blur rounded-2xl shadow-md p-4 sm:p-6 cursor-pointer transition hover:shadow-xl hover:scale-[1.02] border-2 ${
                    selectedRecipe?._id === recipe._id ? 'border-orange-500 shadow-lg' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 pr-2">{recipe.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecipe(recipe._id);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{recipe.description}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                    <span className="flex items-center gap-1 text-gray-700 bg-orange-50 px-2 sm:px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      {recipe.totalTime}min
                    </span>
                    <span className="flex items-center gap-1 text-gray-700 bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      {recipe.servings}
                    </span>
                    <span className="flex items-center gap-1 text-gray-700 bg-red-50 px-2 sm:px-3 py-1 rounded-full">
                      <Flame className="w-3 h-3 sm:w-4 sm:h-4" />
                      {recipe.calories}cal
                    </span>
                    <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 rounded-full font-medium">
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-24 lg:h-fit">
              {selectedRecipe ? (
                <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-4 sm:p-6 border border-orange-100">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {selectedRecipe.name}
                  </h2>
                  <div className="mb-6 flex flex-wrap gap-2">
                    <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                      {selectedRecipe.cuisine}
                    </span>
                    {selectedRecipe.isRegional && (
                      <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-full text-xs sm:text-sm font-medium">
                        {selectedRecipe.region}
                      </span>
                    )}
                  </div>

                  <div className="mb-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                    <h3 className="font-semibold text-base sm:text-lg mb-3 text-orange-900">Ingredients</h3>
                    <ul className="space-y-2">
                      {selectedRecipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="text-sm sm:text-base text-gray-700 flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          <span>{ing.quantity} {ing.unit} {ing.item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-base sm:text-lg mb-4 text-gray-900">Instructions</h3>
                    <ol className="space-y-4">
                      {selectedRecipe.instructions.map((inst) => (
                        <li key={inst.step} className="flex gap-3">
                          <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
                            {inst.step}
                          </span>
                          <span className="text-sm sm:text-base text-gray-700 pt-1">{inst.description}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {selectedRecipe.nutritionInfo && (
                    <div className="border-t-2 border-orange-100 pt-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6">
                      <h3 className="font-semibold text-base sm:text-lg mb-4 text-green-900">Nutrition (per serving)</h3>
                      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-gray-600">Protein</div>
                          <div className="text-base sm:text-lg font-semibold text-green-700">{selectedRecipe.nutritionInfo.protein}g</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-gray-600">Carbs</div>
                          <div className="text-base sm:text-lg font-semibold text-green-700">{selectedRecipe.nutritionInfo.carbs}g</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-gray-600">Fat</div>
                          <div className="text-base sm:text-lg font-semibold text-green-700">{selectedRecipe.nutritionInfo.fat}g</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-gray-600">Fiber</div>
                          <div className="text-base sm:text-lg font-semibold text-green-700">{selectedRecipe.nutritionInfo.fiber}g</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 sm:p-8 lg:p-12 text-center border border-orange-100">
                  <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Select a recipe to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}