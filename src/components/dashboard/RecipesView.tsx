import React, { useState, useEffect } from 'react';
import { Recipe, ProductionBatch, InventoryItem } from '../../types/bakery.ts';
import { formatDate } from '../../utils/format.ts';
import {
  ChefHat,
  Play,
  CheckCircle2,
  AlertTriangle,
  Plus,
  History,
  Layers,
  Scale,
  Clock,
  User,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { authFetch } from '../../lib/auth-client.ts';

export const RecipesView: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'formulations' | 'history'>('formulations');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Run Batch Modal
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [batchCount, setBatchCount] = useState<number>(1);
  const [actualYield, setActualYield] = useState<number | ''>('');
  const [bakerName, setBakerName] = useState('Salim Rashid');
  const [batchNotes, setBatchNotes] = useState('');
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  // New Recipe Modal
  const [showNewRecipeModal, setShowNewRecipeModal] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [yieldQuantity, setYieldQuantity] = useState('24');
  const [yieldUnit, setYieldUnit] = useState('pieces');
  const [instructions, setInstructions] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<
    Array<{ inventoryItemId: string; quantityRequired: string; unit: string; wastageAllowancePercent: string }>
  >([]);
  const [isSubmittingRecipe, setIsSubmittingRecipe] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, bRes, invRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/production/batches'),
        fetch('/api/inventory'),
      ]);
      const rData = await rRes.json();
      const bData = await bRes.json();
      const invData = await invRes.json();
      setRecipes(Array.isArray(rData) ? rData : []);
      setBatches(Array.isArray(bData) ? bData : []);
      setInventoryItems(Array.isArray(invData) ? invData : []);
    } catch (err) {
      console.error('Error fetching recipes & batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const openRunModal = (r: Recipe) => {
    setSelectedRecipe(r);
    setBatchCount(1);
    setActualYield(r.batchYieldQuantity || r.yieldQuantity || 24);
    setBatchNotes('');
    setBatchError(null);
  };

  const handleExecuteBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe) return;
    setBatchError(null);
    setIsSubmittingBatch(true);

    try {
      const res = await authFetch('/api/recipes/produce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: selectedRecipe.id,
          batchCount,
          actualQuantityProduced: actualYield || undefined,
          notes: batchNotes.trim() ? `${batchNotes.trim()} (Baker: ${bakerName})` : `Bake run by ${bakerName}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute production batch');

      setStatusMessage(data.message || `Successfully produced batch of ${selectedRecipe.name}`);
      setSelectedRecipe(null);
      fetchData();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setBatchError(err.message || 'Error executing production batch');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleAddIngredientRow = () => {
    if (inventoryItems.length === 0) return;
    const first = inventoryItems[0];
    setRecipeIngredients((prev) => [
      ...prev,
      {
        inventoryItemId: String(first.id),
        quantityRequired: '1.00',
        unit: first.unit || 'kg',
        wastageAllowancePercent: '0.00',
      },
    ]);
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim() || recipeIngredients.length === 0) return;
    setIsSubmittingRecipe(true);

    try {
      const res = await authFetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipeName.trim(),
          yieldQuantity: Number(yieldQuantity) || 24,
          yieldUnit,
          instructions: instructions.trim() || undefined,
          ingredients: recipeIngredients,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create recipe');

      setShowNewRecipeModal(false);
      setRecipeName('');
      setInstructions('');
      setRecipeIngredients([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creating recipe');
    } finally {
      setIsSubmittingRecipe(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#292524]">
            Bakery Recipes & Production Scaling
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            Standardized kitchen formulations with automated raw ingredient consumption and finished product stock intake.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="p-2 bg-white border border-[#E8DFD8] hover:bg-[#FAF7F2] text-[#57534E] rounded-lg text-xs font-medium transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (recipeIngredients.length === 0) handleAddIngredientRow();
              setShowNewRecipeModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Recipe Formulation</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-xl border border-[#E8DFD8] w-fit shadow-xs">
        <button
          onClick={() => setActiveTab('formulations')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'formulations'
              ? 'bg-[#292524] text-white shadow-xs'
              : 'text-[#78716C] hover:text-[#292524]'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>Formulations ({recipes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-[#292524] text-white shadow-xs'
              : 'text-[#78716C] hover:text-[#292524]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Production Batches Log ({batches.length})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'formulations' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => {
            const maxBatches = r.maxBatchesPossible ?? 0;
            const hasShortage = maxBatches === 0;

            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-[#E8DFD8] p-5 flex flex-col justify-between shadow-xs space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] flex items-center justify-center text-[#C85A32]">
                        <ChefHat className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-display text-base font-bold text-[#292524]">{r.name}</h4>
                        <span className="text-xs text-[#78716C]">
                          Standard Yield: {r.yieldQuantity || r.batchYieldQuantity} {r.yieldUnit || 'pieces'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Capacity Badge */}
                  <div className="mt-3">
                    {hasShortage ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Insufficient Stock (0 batches possible)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Capacity: {maxBatches} batches with current stock</span>
                      </div>
                    )}
                  </div>

                  {r.instructions && (
                    <p className="mt-3 text-xs text-[#57534E] italic bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E8DFD8]">
                      "{r.instructions}"
                    </p>
                  )}

                  {/* Required Ingredients */}
                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">
                      Required Ingredients per Batch:
                    </span>
                    <div className="divide-y divide-[#F0EAE1] border border-[#E8DFD8] rounded-lg overflow-hidden bg-[#FAF7F2] text-xs">
                      {r.ingredients?.map((ing) => (
                        <div key={ing.id} className="p-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-medium text-[#292524]">{ing.itemName}</span>
                            <span className="text-[10px] text-[#78716C] block font-mono">
                              On Hand: {Number(ing.currentStockOnHand || 0).toFixed(2)} {ing.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-[#C85A32] block">
                              {Number(ing.quantityNeeded || ing.quantityRequired).toFixed(2)} {ing.unit}
                            </span>
                            {ing.stockAvailable === false && (
                              <span className="text-[10px] text-red-700 font-bold">Shortage</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8DFD8]">
                  <button
                    onClick={() => openRunModal(r)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FAF7F2] hover:bg-[#C85A32] text-[#292524] hover:text-white rounded-lg text-xs font-semibold border border-[#E8DFD8] transition-colors shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Production Batch</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Production Batches Log Tab */
        <div className="bg-white rounded-xl border border-[#E8DFD8] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E8DFD8]">
                <tr>
                  <th className="py-3 px-4">Batch Code</th>
                  <th className="py-3 px-4">Recipe</th>
                  <th className="py-3 px-4 text-center">Planned Multiplier</th>
                  <th className="py-3 px-4 text-right">Actual Yield</th>
                  <th className="py-3 px-4">Responsible Baker</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Bake Time</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400">
                      No production batches executed yet.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#292524]">
                        {b.batchCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#292524]">
                        {b.recipeName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#57534E]">
                        {b.batchesPlanned}x
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {b.quantityProduced} units
                      </td>
                      <td className="py-3 px-4 text-[#57534E]">
                        {b.bakerName || 'Baker Staff'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#78716C] font-mono">
                        {formatDate(b.bakeFinishTime || b.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-[#78716C]">
                        {b.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RUN PRODUCTION BATCH MODAL */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#E8DFD8]">
              <div>
                <h4 className="font-display text-base font-bold text-[#292524]">
                  Confirm Production Batch: {selectedRecipe.name}
                </h4>
                <p className="text-xs text-[#78716C]">
                  Planned Run: Standard yield {selectedRecipe.batchYieldQuantity || selectedRecipe.yieldQuantity} {selectedRecipe.yieldUnit} per batch.
                </p>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="text-stone-400 hover:text-stone-900 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {batchError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{batchError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteBatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Batch Count Multiplier *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={batchCount}
                    onChange={(e) => {
                      const c = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setBatchCount(c);
                      const baseYield = selectedRecipe.batchYieldQuantity || selectedRecipe.yieldQuantity || 24;
                      setActualYield(baseYield * c);
                    }}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-sm font-bold text-[#292524]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Actual Finished Goods Yield ({selectedRecipe.yieldUnit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={actualYield}
                    onChange={(e) => setActualYield(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 48"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-sm font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Responsible Baker / Shift Lead
                </label>
                <select
                  value={bakerName}
                  onChange={(e) => setBakerName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                >
                  <option value="Salim Rashid">Salim Rashid (Head Baker)</option>
                  <option value="Amina Kassim">Amina Kassim (Pastry Specialist)</option>
                  <option value="Juma Ally">Juma Ally (Oven Lead)</option>
                </select>
              </div>

              {/* Real-time Ingredient Consumption Preview */}
              <div className="space-y-1.5 p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DFD8]">
                <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">
                  Ingredients to be deducted from inventory:
                </span>
                <div className="divide-y divide-[#E8DFD8]">
                  {selectedRecipe.ingredients?.map((ing) => {
                    const single = Number(ing.quantityNeeded || ing.quantityRequired || 0);
                    const totalNeeded = single * batchCount;
                    const stock = Number(ing.currentStockOnHand || 0);
                    const hasEnough = stock >= totalNeeded;

                    return (
                      <div key={ing.id} className="py-1 flex justify-between items-center text-xs">
                        <span className="text-[#292524]">{ing.itemName}</span>
                        <div className="text-right font-mono">
                          <span className={hasEnough ? 'text-[#292524] font-semibold' : 'text-red-700 font-bold'}>
                            {totalNeeded.toFixed(2)} {ing.unit}
                          </span>
                          <span className="text-[10px] text-[#78716C] block">
                            (Stock: {stock.toFixed(2)})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Bake Run Notes / Variance Explanation
                </label>
                <input
                  type="text"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="e.g. Morning 5am bake; oven temperature held at 220°C"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  className="flex-1 py-2 bg-[#FAF7F2] text-[#57534E] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch}
                  className="flex-1 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmittingBatch ? 'Executing Bake...' : 'Confirm Production Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE RECIPE MODAL */}
      {showNewRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#E8DFD8]">
              <h4 className="font-display text-base font-bold text-[#292524]">
                Create Kitchen Recipe Formulation
              </h4>
              <button
                onClick={() => setShowNewRecipeModal(false)}
                className="text-stone-400 hover:text-stone-900 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecipe} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Recipe Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="e.g. Rustic Olive Ciabatta"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Standard Batch Yield *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={yieldQuantity}
                    onChange={(e) => setYieldQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Yield Unit
                  </label>
                  <select
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  >
                    <option value="pieces">pieces / units</option>
                    <option value="loaves">loaves</option>
                    <option value="buns">buns</option>
                    <option value="croissants">croissants</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Preparation Instructions
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. 24h cold fermentation, fold dough twice during bulk rest."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                />
              </div>

              {/* Recipe Ingredients */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-[#78716C] uppercase">
                    Raw Ingredients Formulation
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs text-[#C85A32] font-semibold hover:underline"
                  >
                    + Add Ingredient
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recipeIngredients.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-[#FAF7F2] p-2 rounded-lg border border-[#E8DFD8]">
                      <select
                        value={row.inventoryItemId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          const inv = inventoryItems.find((i) => i.id === nextId);
                          setRecipeIngredients((prev) => {
                            const copy = [...prev];
                            copy[idx].inventoryItemId = nextId;
                            if (inv) copy[idx].unit = inv.unit;
                            return copy;
                          });
                        }}
                        className="flex-1 px-2 py-1 bg-white border border-[#E8DFD8] rounded"
                      >
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={row.quantityRequired}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRecipeIngredients((prev) => {
                            const copy = [...prev];
                            copy[idx].quantityRequired = val;
                            return copy;
                          });
                        }}
                        className="w-20 px-2 py-1 text-center font-mono bg-white border border-[#E8DFD8] rounded"
                        placeholder="Qty"
                      />

                      <span className="text-[11px] font-mono text-[#78716C] w-10">{row.unit}</span>

                      <button
                        type="button"
                        onClick={() => setRecipeIngredients((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-stone-400 hover:text-red-600 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRecipeModal(false)}
                  className="flex-1 py-2 bg-[#FAF7F2] text-[#57534E] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRecipe || recipeIngredients.length === 0}
                  className="flex-1 py-2 bg-[#C85A32] text-white rounded-lg font-semibold hover:bg-[#B34F2B]"
                >
                  {isSubmittingRecipe ? 'Saving...' : 'Save Recipe Formulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
