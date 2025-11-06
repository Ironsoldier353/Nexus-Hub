import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Clock,
  Users,
  Flame,
  Trash2,
  Plus,
  Loader2,
  ArrowLeft,
  Sparkles,
  Mic,
  MicOff,
  Check,
} from 'lucide-react';

export default function RecipePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // ---------- Form state ----------
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
    spiceLevel: 'medium',
  });

  // ---------- Voice state ----------
  const [voiceTab, setVoiceTab] = useState<'manual' | 'voice'>('manual');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // ---------- Fetch recipes ----------
  useEffect(() => {
    fetchRecipes();
  }, [roomId]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nexus-hub-vvqm.onrender.com/api/v1/recipes/room/${roomId}`
      );
      const data = await response.json();
      if (data.success) setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Submit (manual or voice) ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    const payload = {
      ...formData,
      calories: parseInt(formData.calories) || 500,
      prepTime: parseInt(formData.prepTime) || 30,
      servings: parseInt(formData.servings) || 4,
      ingredients: formData.ingredients
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch(
        `https://nexus-hub-vvqm.onrender.com/api/v1/recipes/room/${roomId}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (data.success) {
        setRecipes([data.recipe, ...recipes]);
        setShowForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
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
      spiceLevel: 'medium',
    });
    setTranscript('');
  };

  // ---------- Delete recipe ----------
  const deleteRecipe = async (recipeId: string) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      const response = await fetch(
        `https://nexus-hub-vvqm.onrender.com/api/v1/recipes/${recipeId}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        setRecipes(recipes.filter((r) => r._id !== recipeId));
        setSelectedRecipe(null);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  // ---------- Voice recognition ----------
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('SpeechRecognition not supported');
      return;
    }

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) final += res[0].transcript + ' ';
        else interim += res[0].transcript;
      }
      setTranscript((prev) => prev + final + interim);
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error', e);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Fill form from voice transcript (simple heuristic)
  const applyVoiceTranscript = () => {
    const text = transcript.toLowerCase().trim();

    // Very light parsing – improve as needed
    const caloriesMatch = text.match(/(\d+)\s*calorie/i);
    const prepMatch = text.match(/(\d+)\s*minute/i);
    const servingsMatch = text.match(/(\d+)\s*serving/i);
    const cuisineMatch = text.match(/(indian|italian|chinese|mexican|thai|french)/i);
    const spiceMatch = text.match(/(mild|medium|spicy)/i);
    const difficultyMatch = text.match(/(easy|medium|hard)/i);
    const ingredients = text
      .split(/,|and/)
      .map((s) => s.trim())
      .filter((s) => s && !/calorie|minute|serving|mild|medium|spicy|easy|hard|indian|italian|chinese|mexican|thai|french/i.test(s));

    setFormData((prev) => ({
      ...prev,
      calories: caloriesMatch ? caloriesMatch[1] : prev.calories,
      prepTime: prepMatch ? prepMatch[1] : prev.prepTime,
      servings: servingsMatch ? servingsMatch[1] : prev.servings,
      cuisine: cuisineMatch ? cuisineMatch[0] : prev.cuisine,
      spiceLevel: spiceMatch ? spiceMatch[0] : prev.spiceLevel,
      difficulty: difficultyMatch ? difficultyMatch[0] : prev.difficulty,
      ingredients: ingredients.length ? ingredients.join(', ') : prev.ingredients,
    }));

    setTranscript('');
  };

  // -------------------------------------------------
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
                  LumenHive
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Recipe Collection</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/admin/dashboard/${roomId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Generate</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Form (stylish) */}
      {showForm && (
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-5 sm:p-8 mb-8 mx-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-800">Generate New Recipe</h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-orange-200 mb-6">
            <button
              onClick={() => setVoiceTab('manual')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                voiceTab === 'manual'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setVoiceTab('voice')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                voiceTab === 'voice'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mic className="inline w-4 h-4 mr-1" /> Voice
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {voiceTab === 'manual' ? (
              /* ==================== MANUAL FIELDS ==================== */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Calories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.calories}
                    onChange={(e) =>
                      setFormData({ ...formData, calories: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredients (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="tomato, onion, garlic"
                    value={formData.ingredients}
                    onChange={(e) =>
                      setFormData({ ...formData, ingredients: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
                  />
                </div>

                {/* Cuisine */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuisine
                  </label>
                  <input
                    type="text"
                    placeholder="Italian, Indian, etc."
                    value={formData.cuisine}
                    onChange={(e) =>
                      setFormData({ ...formData, cuisine: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Prep Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    value={formData.prepTime}
                    onChange={(e) =>
                      setFormData({ ...formData, prepTime: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
                  />
                </div>

                {/* Servings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servings
                  </label>
                  <input
                    type="number"
                    placeholder="4"
                    value={formData.servings}
                    onChange={(e) =>
                      setFormData({ ...formData, servings: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Punjab, Tuscany"
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        region: e.target.value,
                        isRegional: !!e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
                  />
                </div>

                {/* Spice Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spice Level
                  </label>
                  <select
                    value={formData.spiceLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, spiceLevel: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
                  >
                    <option value="mild">Mild</option>
                    <option value="medium">Medium Spice</option>
                    <option value="spicy">Spicy</option>
                  </select>
                </div>
              </div>
            ) : (
              /* ==================== VOICE TAB ==================== */
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-6 rounded-full transition-all shadow-lg ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                    } text-white`}
                  >
                    {isListening ? (
                      <MicOff className="w-10 h-10" />
                    ) : (
                      <Mic className="w-10 h-10" />
                    )}
                  </button>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    {isListening ? 'Listening…' : 'Tap to speak'}
                  </p>
                </div>

                {/* Live transcript */}
                {transcript && (
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
                  </div>
                )}

                {/* Apply button */}
                {transcript && (
                  <button
                    type="button"
                    onClick={applyVoiceTranscript}
                    className="flex items-center gap-2 mx-auto px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition shadow-md"
                  >
                    <Check className="w-5 h-5" />
                    Fill Form from Speech
                  </button>
                )}

                {/* Show the same form fields (read-only preview) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                  {[
                    { label: 'Calories', value: formData.calories || '-' },
                    { label: 'Ingredients', value: formData.ingredients || '-' },
                    { label: 'Cuisine', value: formData.cuisine || '-' },
                    { label: 'Difficulty', value: formData.difficulty },
                    { label: 'Prep Time', value: formData.prepTime || '-' },
                    { label: 'Servings', value: formData.servings },
                    { label: 'Region', value: formData.region || '-' },
                    { label: 'Spice Level', value: formData.spiceLevel },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-xs font-medium text-gray-600">
                        {field.label}
                      </label>
                      <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit / Cancel */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={generating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:from-orange-600 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-500 transition shadow-lg flex items-center justify-center gap-2 font-medium"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating…
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
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rest of the page (unchanged) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-orange-100">
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-12 h-12 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No recipes yet</h3>
              <p className="text-gray-600">Generate your first recipe to get started!</p>
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
                    selectedRecipe?._id === recipe._id
                      ? 'border-orange-500 shadow-lg'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 pr-2">
                      {recipe.name}
                    </h3>
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
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {recipe.description}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-700 bg-orange-50 px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4" />
                      {recipe.totalTime}min
                    </span>
                    <span className="flex items-center gap-1 text-gray-700 bg-blue-50 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4" />
                      {recipe.servings}
                    </span>
                    <span className="flex items-center gap-1 text-gray-700 bg-red-50 px-3 py-1 rounded-full">
                      <Flame className="w-4 h-4" />
                      {recipe.calories}cal
                    </span>
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 rounded-full font-medium">
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
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-sm font-medium">
                      {selectedRecipe.cuisine}
                    </span>
                    {selectedRecipe.isRegional && (
                      <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-full text-sm font-medium">
                        {selectedRecipe.region}
                      </span>
                    )}
                  </div>

                  <div className="mb-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                    <h3 className="font-semibold text-lg mb-3 text-orange-900">Ingredients</h3>
                    <ul className="space-y-2">
                      {selectedRecipe.ingredients.map((ing: any, idx: number) => (
                        <li key={idx} className="text-gray-700 flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          <span>
                            {ing.quantity} {ing.unit} {ing.item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-4 text-gray-900">Instructions</h3>
                    <ol className="space-y-4">
                      {selectedRecipe.instructions.map((inst: any) => (
                        <li key={inst.step} className="flex gap-3">
                          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                            {inst.step}
                          </span>
                          <span className="text-gray-700 pt-1">{inst.description}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {selectedRecipe.nutritionInfo && (
                    <div className="border-t-2 border-orange-100 pt-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6">
                      <h3 className="font-semibold text-lg mb-4 text-green-900">
                        Nutrition (per serving)
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-gray-600">Protein</div>
                          <div className="text-lg font-semibold text-green-700">
                            {selectedRecipe.nutritionInfo.protein}g
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-gray-600">Carbs</div>
                          <div className="text-lg font-semibold text-green-700">
                            {selectedRecipe.nutritionInfo.carbs}g
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-gray-600">Fat</div>
                          <div className="text-lg font-semibold text-green-700">
                            {selectedRecipe.nutritionInfo.fat}g
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-gray-600">Fiber</div>
                          <div className="text-lg font-semibold text-green-700">
                            {selectedRecipe.nutritionInfo.fiber}g
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-orange-100">
                  <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChefHat className="w-10 h-10 text-orange-500" />
                  </div>
                  <p className="text-gray-600">Select a recipe to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
