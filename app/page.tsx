"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Ingredient = {
  name: string;
  amount: number;
  unit: string;
};

type Recipe = {
  id?: number;
  name: string;
  ingredients: Ingredient[];
};

const initialRecipes: Recipe[] = [];

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<string[]>([]);
  const [shoppingList, setShoppingList] = useState<Ingredient[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [people, setPeople] = useState(2);

  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState("");
  const [newIngredients, setNewIngredients] = useState<Ingredient[]>([]);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientAmount, setNewIngredientAmount] = useState("");
  const [newIngredientUnit, setNewIngredientUnit] = useState("個");

  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editRecipeName, setEditRecipeName] = useState("");
  const [editIngredients, setEditIngredients] = useState<Ingredient[]>([]);
  const [editIngredientName, setEditIngredientName] = useState("");
  const [editIngredientAmount, setEditIngredientAmount] = useState("");
  const [editIngredientUnit, setEditIngredientUnit] = useState("個");

  const [isLoaded, setIsLoaded] = useState(false);
  const [shoppingListLoaded, setShoppingListLoaded] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const [showAddShoppingItem, setShowAddShoppingItem] = useState(false);
  const [shoppingItemName, setShoppingItemName] = useState("");
  const [shoppingItemAmount, setShoppingItemAmount] = useState("");
  const [shoppingItemUnit, setShoppingItemUnit] = useState("個");

  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ========================================
  // Supabaseからレシピ＋食材を読み込み
  // ========================================
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const { data: recipeData, error: recipeError } =
          await supabase
            .from("recipes")
            .select("*")
            .order("id", { ascending: true });

        if (recipeError) {
          throw recipeError;
        }

        const { data: ingredientData, error: ingredientError } =
          await supabase
            .from("recipe_ingredients")
            .select("*")
            .order("id", { ascending: true });

        if (ingredientError) {
          throw ingredientError;
        }

        const loadedRecipes: Recipe[] =
          (recipeData || []).map((recipe) => ({
            id: recipe.id,
            name: recipe.name,
            ingredients: (ingredientData || [])
              .filter(
                (ingredient) =>
                   Number(ingredient.recipe_id) === Number(recipe.id)
              )
              .map((ingredient) => ({
                name: ingredient.name,
                amount: Number(ingredient.amount),
                unit: ingredient.unit,
              })),
          }));

        console.log("recipeData:", recipeData);
        console.log("ingredientData:", ingredientData);
        console.log("loadedRecipes:", loadedRecipes);
          setRecipes(loadedRecipes);

        const savedFavorites =
          localStorage.getItem("favorites");

        if (savedFavorites) {
          const parsedFavorites: string[] =
            JSON.parse(savedFavorites);

          if (Array.isArray(parsedFavorites)) {
            setFavorites(parsedFavorites);
          }
        }
      } catch (error) {
        console.error(
          "Supabaseからレシピの読み込みに失敗しました",
          error
        );
      }

      setIsLoaded(true);
    };

    loadRecipes();
  }, []);

  // ========================================
  // お気に入り保存
  // ========================================
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
      );
    } catch (error) {
      console.error(
        "お気に入りの保存に失敗しました",
        error
      );
    }
  }, [favorites, isLoaded]);

  // ========================================
  // 買い物リスト読み込み
  // ========================================
  useEffect(() => {
    try {
      const savedShoppingList =
        localStorage.getItem("shoppingList");

      const savedCheckedItems =
        localStorage.getItem("checkedItems");

      if (savedShoppingList) {
        const parsedShoppingList: Ingredient[] =
          JSON.parse(savedShoppingList);

        if (Array.isArray(parsedShoppingList)) {
          setShoppingList(parsedShoppingList);
        }
      }

      if (savedCheckedItems) {
        const parsedCheckedItems: string[] =
          JSON.parse(savedCheckedItems);

        if (Array.isArray(parsedCheckedItems)) {
          setCheckedItems(parsedCheckedItems);
        }
      }
    } catch (error) {
      console.error(
        "買い物リストの読み込みに失敗しました",
        error
      );
    }

    setShoppingListLoaded(true);
  }, []);

  // ========================================
  // 買い物リスト保存
  // ========================================
  useEffect(() => {
    if (!shoppingListLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        "shoppingList",
        JSON.stringify(shoppingList)
      );

      localStorage.setItem(
        "checkedItems",
        JSON.stringify(checkedItems)
      );
    } catch (error) {
      console.error(
        "買い物リストの保存に失敗しました",
        error
      );
    }
  }, [
    shoppingList,
    checkedItems,
    shoppingListLoaded,
  ]);

  // ========================================
  // レシピ選択
  // ========================================
  const toggleRecipe = (recipeName: string) => {
    setSelectedRecipe((current) =>
      current.includes(recipeName)
        ? current.filter((name) => name !== recipeName)
        : [...current, recipeName]
    );
  };

  // ========================================
  // お気に入り切り替え
  // ========================================
  const toggleFavorite = (recipeName: string) => {
    setFavorites((current) =>
      current.includes(recipeName)
        ? current.filter((name) => name !== recipeName)
        : [...current, recipeName]
    );
  };

  // ========================================
  // 新規レシピ：食材追加
  // ========================================
  const addIngredient = () => {
    if (
      newIngredientName.trim() === "" ||
      newIngredientAmount === ""
    ) {
      return;
    }

    const ingredient: Ingredient = {
      name: newIngredientName.trim(),
      amount: Number(newIngredientAmount),
      unit: newIngredientUnit,
    };

    setNewIngredients((current) => [
      ...current,
      ingredient,
    ]);

    setNewIngredientName("");
    setNewIngredientAmount("");
    setNewIngredientUnit("個");
  };

  // ========================================
  // 新規レシピ：食材削除
  // ========================================
  const removeIngredient = (index: number) => {
    setNewIngredients((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  // ========================================
  // レシピ追加
  // ========================================
  const addRecipe = async () => {
    if (
      newRecipeName.trim() === "" ||
      newIngredients.length === 0
    ) {
      return;
    }

    const recipeName = newRecipeName.trim();

    const alreadyExists = recipes.some(
      (recipe) => recipe.name === recipeName
    );

    if (alreadyExists) {
      alert("同じ名前のレシピがすでにあります");
      return;
    }

    try {
      const { data: recipeData, error: recipeError } =
        await supabase
          .from("recipes")
          .insert({
            name: recipeName,
          })
          .select()
          .single();

      if (recipeError) {
        throw recipeError;
      }

      const ingredientsToInsert =
        newIngredients.map((ingredient) => ({
          recipe_id: recipeData.id,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
        }));

      const { error: ingredientError } =
        await supabase
          .from("recipe_ingredients")
          .insert(ingredientsToInsert);

      if (ingredientError) {
        throw ingredientError;
      }

      const newRecipe: Recipe = {
        id: recipeData.id,
        name: recipeName,
        ingredients: newIngredients,
      };

      setRecipes((current) => [
        ...current,
        newRecipe,
      ]);

      setNewRecipeName("");
      setNewIngredients([]);
      setNewIngredientName("");
      setNewIngredientAmount("");
      setNewIngredientUnit("個");
      setShowAddRecipe(false);
    } catch (error) {
      console.error(
        "レシピの追加に失敗しました",
        error
      );

      alert("レシピの追加に失敗しました");
    }
  };

  // ========================================
  // レシピ編集開始
  // ========================================
  const startEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setEditRecipeName(recipe.name);

    setEditIngredients(
      recipe.ingredients.map((ingredient) => ({
        ...ingredient,
      }))
    );

    setEditIngredientName("");
    setEditIngredientAmount("");
    setEditIngredientUnit("個");
  };

  // ========================================
  // 編集中の食材追加
  // ========================================
  const addEditIngredient = () => {
    if (
      editIngredientName.trim() === "" ||
      editIngredientAmount === ""
    ) {
      return;
    }

    const ingredient: Ingredient = {
      name: editIngredientName.trim(),
      amount: Number(editIngredientAmount),
      unit: editIngredientUnit,
    };

    setEditIngredients((current) => [
      ...current,
      ingredient,
    ]);

    setEditIngredientName("");
    setEditIngredientAmount("");
    setEditIngredientUnit("個");
  };

  // ========================================
  // 編集中の食材削除
  // ========================================
  const removeEditIngredient = (index: number) => {
    setEditIngredients((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  // ========================================
  // レシピ編集保存
  // ========================================
  const saveEditedRecipe = async () => {
    if (
      !editingRecipe ||
      editRecipeName.trim() === "" ||
      editIngredients.length === 0
    ) {
      return;
    }

    const newName = editRecipeName.trim();

    const duplicateName = recipes.some(
      (recipe) =>
        recipe.name === newName &&
        recipe.id !== editingRecipe.id
    );

    if (duplicateName) {
      alert("同じ名前のレシピがすでにあります");
      return;
    }

    if (!editingRecipe.id) {
      return;
    }

    try {
      const { error: recipeError } =
        await supabase
          .from("recipes")
          .update({
            name: newName,
          })
          .eq("id", editingRecipe.id);

      if (recipeError) {
        throw recipeError;
      }

      const { error: deleteError } =
        await supabase
          .from("recipe_ingredients")
          .delete()
          .eq("recipe_id", editingRecipe.id);

      if (deleteError) {
        throw deleteError;
      }

      const ingredientsToInsert =
        editIngredients.map((ingredient) => ({
          recipe_id: editingRecipe.id,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
        }));

      const { error: ingredientError } =
        await supabase
          .from("recipe_ingredients")
          .insert(ingredientsToInsert);

      if (ingredientError) {
        throw ingredientError;
      }

      const updatedRecipe: Recipe = {
        id: editingRecipe.id,
        name: newName,
        ingredients: editIngredients,
      };

      setRecipes((current) =>
        current.map((recipe) =>
          recipe.id === editingRecipe.id
            ? updatedRecipe
            : recipe
        )
      );

      setSelectedRecipe((current) =>
        current.map((name) =>
          name === editingRecipe.name
            ? newName
            : name
        )
      );

      setFavorites((current) =>
        current.map((name) =>
          name === editingRecipe.name
            ? newName
            : name
        )
      );

      setEditingRecipe(null);
    } catch (error) {
      console.error(
        "レシピの編集に失敗しました",
        error
      );

      alert("レシピの編集に失敗しました");
    }
  };

  // ========================================
  // レシピ削除
  // ========================================
  const deleteRecipe = async (recipe: Recipe) => {
    const confirmed = window.confirm(
      `「${recipe.name}」を削除しますか？`
    );

    if (!confirmed) {
      return;
    }

    if (!recipe.id) {
      return;
    }

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

      if (error) {
        throw error;
      }

      setRecipes((current) =>
        current.filter(
          (item) => item.id !== recipe.id
        )
      );

      setSelectedRecipe((current) =>
        current.filter(
          (name) => name !== recipe.name
        )
      );

      setFavorites((current) =>
        current.filter(
          (name) => name !== recipe.name
        )
      );
    } catch (error) {
      console.error(
        "レシピの削除に失敗しました",
        error
      );

      alert("レシピの削除に失敗しました");
    }
  };

  // ========================================
  // 買い物リスト作成
  // ========================================
  const createShoppingList = () => {
    const ingredientMap: Record<
      string,
      Ingredient
    > = {};

    selectedRecipe.forEach((recipeName) => {
      const recipe = recipes.find(
        (recipe) => recipe.name === recipeName
      );

      recipe?.ingredients.forEach((ingredient) => {
        const key =
          `${ingredient.name}-${ingredient.unit}`;

        const adjustedAmount =
          ingredient.amount * (people / 2);

        if (ingredientMap[key]) {
          ingredientMap[key].amount +=
            adjustedAmount;
        } else {
          ingredientMap[key] = {
            ...ingredient,
            amount: adjustedAmount,
          };
        }
      });
    });

    setShoppingList(
      Object.values(ingredientMap)
    );

    setCheckedItems([]);
    setCopyMessage("");
  };

  // ========================================
  // 買い物リストへ手動追加
  // ========================================
  const addShoppingItem = () => {
    if (
      shoppingItemName.trim() === "" ||
      shoppingItemAmount === ""
    ) {
      return;
    }

    const name = shoppingItemName.trim();
    const amount = Number(shoppingItemAmount);
    const unit = shoppingItemUnit;

    const existingIndex =
      shoppingList.findIndex(
        (ingredient) =>
          ingredient.name === name &&
          ingredient.unit === unit
      );

    if (existingIndex !== -1) {
      setShoppingList((current) =>
        current.map(
          (ingredient, index) =>
            index === existingIndex
              ? {
                  ...ingredient,
                  amount:
                    ingredient.amount +
                    amount,
                }
              : ingredient
        )
      );
    } else {
      setShoppingList((current) => [
        ...current,
        {
          name,
          amount,
          unit,
        },
      ]);
    }

    setShoppingItemName("");
    setShoppingItemAmount("");
    setShoppingItemUnit("個");
    setShowAddShoppingItem(false);
    setCopyMessage("");
  };

  // ========================================
  // 買い物リストから項目削除
  // ========================================
  const removeShoppingItem = (
    ingredientName: string,
    ingredientUnit: string
  ) => {
    const confirmed = window.confirm(
      `「${ingredientName} ${ingredientUnit}」を買い物リストから削除しますか？`
    );

    if (!confirmed) {
      return;
    }

    setShoppingList((current) =>
      current.filter(
        (ingredient) =>
          !(
            ingredient.name === ingredientName &&
            ingredient.unit === ingredientUnit
          )
      )
    );

    setCheckedItems((current) =>
      current.filter(
        (item) => item !== ingredientName
      )
    );

    setCopyMessage("");
  };

  // ========================================
  // チェック切り替え
  // ========================================
  const toggleChecked = (
    ingredientName: string
  ) => {
    setCheckedItems((current) =>
      current.includes(ingredientName)
        ? current.filter(
            (item) =>
              item !== ingredientName
          )
        : [...current, ingredientName]
    );
  };

  // ========================================
  // 全部チェック
  // ========================================
  const checkAll = () => {
    setCheckedItems(
      shoppingList.map(
        (ingredient) => ingredient.name
      )
    );
  };

  // ========================================
  // 全部チェック解除
  // ========================================
  const uncheckAll = () => {
    setCheckedItems([]);
  };

  // ========================================
  // 買い物リストコピー
  // ========================================
  const copyShoppingList = async () => {
    const text = [
      `🛒 買い物リスト（${people}人分）`,
      "",
      ...shoppingList.map((ingredient) => {
        const checked =
          checkedItems.includes(
            ingredient.name
          );

        return `${checked ? "☑" : "☐"} ${
          ingredient.name
        } ${ingredient.amount}${
          ingredient.unit
        }`;
      }),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);

      setCopyMessage(
        "✅ 買い物リストをコピーしました！"
      );

      setTimeout(() => {
        setCopyMessage("");
      }, 2000);
    } catch (error) {
      console.error(
        "コピーに失敗しました",
        error
      );

      setCopyMessage(
        "コピーに失敗しました"
      );
    }
  };

  // ========================================
  // 買い物完了
  // ========================================
  const completeShopping = () => {
    const confirmed = window.confirm(
      "買い物を完了して、リストを削除しますか？"
    );

    if (!confirmed) {
      return;
    }

    setShoppingList([]);
    setCheckedItems([]);
    setCopyMessage("");

    localStorage.removeItem("shoppingList");
    localStorage.removeItem("checkedItems");
  };

  // ========================================
  // 検索・お気に入りフィルター
  // ========================================
  const filteredRecipes = recipes.filter(
    (recipe) => {
      const matchesSearch =
        recipe.name
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        recipe.ingredients.some((ingredient) =>
          ingredient.name
            .toLowerCase()
            .includes(searchText.toLowerCase())
        );

      const matchesFavorite =
        !showFavoritesOnly ||
        favorites.includes(recipe.name);

      return matchesSearch && matchesFavorite;
    }
  );

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-4xl">

        {/* ヘッダー */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl">
              🛒
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                レシピ買い出しアプリ
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                作りたい料理を選んで買い物リストを作ろう
              </p>
            </div>
          </div>
        </div>

        {/* 人数選択 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold">
            👨‍👩‍👧 何人分？
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map(
              (number) => (
                <button
                  key={number}
                  onClick={() =>
                    setPeople(number)
                  }
                  className={`min-h-12 rounded-xl px-4 py-3 font-bold transition ${
                    people === number
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {number}人
                </button>
              )
            )}
          </div>
        </div>

        {/* レシピ追加 */}
        <button
          onClick={() =>
            setShowAddRecipe(
              !showAddRecipe
            )
          }
          className="mt-5 w-full rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-4 font-bold text-blue-600 transition hover:bg-blue-100"
        >
          ＋ レシピを追加する
        </button>

        {showAddRecipe && (
          <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

            <h2 className="text-lg font-bold">
              新しいレシピを追加
            </h2>

            <div className="mt-4">
              <label className="text-sm font-bold">
                レシピ名
              </label>

              <input
                value={newRecipeName}
                onChange={(e) =>
                  setNewRecipeName(
                    e.target.value
                  )
                }
                placeholder="例：ハンバーグ"
                className="mt-1 min-h-12 w-full rounded-xl border p-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-6 border-t pt-5">

              <h3 className="font-bold">
                食材を追加
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">

                <input
                  value={newIngredientName}
                  onChange={(e) =>
                    setNewIngredientName(
                      e.target.value
                    )
                  }
                  placeholder="食材名"
                  className="min-h-12 rounded-xl border p-3"
                />

                <input
                  type="number"
                  value={newIngredientAmount}
                  onChange={(e) =>
                    setNewIngredientAmount(
                      e.target.value
                    )
                  }
                  placeholder="数量"
                  className="min-h-12 rounded-xl border p-3"
                />

                <select
                  value={newIngredientUnit}
                  onChange={(e) =>
                    setNewIngredientUnit(
                      e.target.value
                    )
                  }
                  className="min-h-12 rounded-xl border p-3"
                >
                  <option value="個">個</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="本">本</option>
                  <option value="枚">枚</option>
                  <option value="杯">杯</option>
                  <option value="袋">袋</option>
                  <option value="パック">パック</option>
                </select>

              </div>

              <button
                onClick={addIngredient}
                className="mt-3 min-h-12 rounded-xl bg-gray-800 px-5 py-3 font-bold text-white"
              >
                ＋ 食材を追加
              </button>
            </div>

            {newIngredients.length > 0 && (
              <div className="mt-5">

                <h3 className="font-bold">
                  追加した食材
                </h3>

                <ul className="mt-3 space-y-2">

                  {newIngredients.map(
                    (ingredient, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
                      >
                        <span>
                          {ingredient.name}{" "}
                          {ingredient.amount}
                          {ingredient.unit}
                        </span>

                        <button
                          onClick={() =>
                            removeIngredient(
                              index
                            )
                          }
                          className="rounded-lg px-3 py-2 text-sm font-bold text-red-500"
                        >
                          削除
                        </button>
                      </li>
                    )
                  )}

                </ul>
              </div>
            )}

            <button
              onClick={addRecipe}
              disabled={
                newRecipeName.trim() === "" ||
                newIngredients.length === 0
              }
              className="mt-6 min-h-12 w-full rounded-xl bg-blue-600 p-3 font-bold text-white disabled:bg-gray-300"
            >
              レシピを保存する
            </button>

          </div>
        )}

        {/* 検索・お気に入り */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              🍳 レシピを探す
            </h2>

            <span className="text-sm text-gray-500">
              {filteredRecipes.length}件
            </span>
          </div>

          <div className="mt-4">

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>

              <input
                value={searchText}
                onChange={(e) =>
                  setSearchText(
                    e.target.value
                  )
                }
                placeholder="レシピ名・食材名で検索"
                className="min-h-12 w-full rounded-xl border bg-gray-50 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <button
              onClick={() =>
                setShowFavoritesOnly(
                  !showFavoritesOnly
                )
              }
              className={`mt-3 min-h-11 rounded-xl px-4 py-2 font-bold transition ${
                showFavoritesOnly
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showFavoritesOnly
                ? "★ お気に入りのみ表示中"
                : "☆ お気に入りだけ見る"}
            </button>

          </div>
        </div>

        {/* レシピ一覧 */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          {filteredRecipes.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">
                レシピがありません
              </p>
            </div>
          ) : (
            filteredRecipes.map((recipe) => {

              const isSelected =
                selectedRecipe.includes(
                  recipe.name
                );

              const isFavorite =
                favorites.includes(
                  recipe.name
                );

              return (
                <div
                  key={recipe.id ?? recipe.name}
                  className={`rounded-2xl border p-5 shadow-sm transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >

                  <div className="flex items-start gap-2">

                    <button
                      onClick={() =>
                        toggleRecipe(
                          recipe.name
                        )
                      }
                      className="min-w-0 flex-1 text-left"
                    >

                      <div className="flex items-center gap-2">

                        <h2 className="text-xl font-bold">
                          {recipe.name}
                        </h2>

                        {isSelected && (
                          <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                            選択中
                          </span>
                        )}

                      </div>

                      <div className="mt-3 space-y-1 text-sm text-gray-500">

                        {recipe.ingredients.map(
                          (ingredient, index) => (
                            <p
                              key={`${ingredient.name}-${ingredient.unit}-${index}`}
                            >
                              {ingredient.name}{" "}
                              {ingredient.amount}
                              {ingredient.unit}
                            </p>
                          )
                        )}

                      </div>

                    </button>

                    <button
                      onClick={() =>
                        toggleFavorite(
                          recipe.name
                        )
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl hover:bg-yellow-50"
                      aria-label={
                        isFavorite
                          ? "お気に入りから削除"
                          : "お気に入りに追加"
                      }
                    >
                      {isFavorite ? "★" : "☆"}
                    </button>

                  </div>

                  <div className="mt-4 flex gap-2 border-t pt-3">

                    <button
                      onClick={() =>
                        startEditRecipe(
                          recipe
                        )
                      }
                      className="min-h-11 flex-1 rounded-xl bg-gray-100 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                    >
                      ✏️ 編集
                    </button>

                    <button
                      onClick={() =>
                        deleteRecipe(
                          recipe
                        )
                      }
                      className="min-h-11 flex-1 rounded-xl bg-red-50 py-2 text-sm font-bold text-red-600 hover:bg-red-100"
                    >
                      🗑️ 削除
                    </button>

                  </div>

                </div>
              );
            })
          )}

        </div>

        {/* 編集フォーム */}
        {editingRecipe && (
          <div className="mt-8 rounded-2xl border-2 border-blue-300 bg-blue-50 p-5 sm:p-6">

            <div className="flex items-center justify-between">

              <h2 className="text-lg font-bold">
                ✏️ レシピを編集
              </h2>

              <button
                onClick={() =>
                  setEditingRecipe(null)
                }
                className="rounded-lg px-3 py-2 text-gray-500"
              >
                ✕ 閉じる
              </button>

            </div>

            <div className="mt-4">

              <label className="text-sm font-bold">
                レシピ名
              </label>

              <input
                value={editRecipeName}
                onChange={(e) =>
                  setEditRecipeName(
                    e.target.value
                  )
                }
                className="mt-1 min-h-12 w-full rounded-xl border p-3"
              />

            </div>

            <div className="mt-6">

              <h3 className="font-bold">
                食材
              </h3>

              <ul className="mt-3 space-y-2">

                {editIngredients.map(
                  (ingredient, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between rounded-xl bg-white p-3"
                    >

                      <span>
                        {ingredient.name}{" "}
                        {ingredient.amount}
                        {ingredient.unit}
                      </span>

                      <button
                        onClick={() =>
                          removeEditIngredient(
                            index
                          )
                        }
                        className="rounded-lg px-3 py-2 text-sm font-bold text-red-500"
                      >
                        削除
                      </button>

                    </li>
                  )
                )}

              </ul>

            </div>

            <div className="mt-5">

              <div className="grid gap-3 sm:grid-cols-3">

                <input
                  value={editIngredientName}
                  onChange={(e) =>
                    setEditIngredientName(
                      e.target.value
                    )
                  }
                  placeholder="食材名"
                  className="min-h-12 rounded-xl border p-3"
                />

                <input
                  type="number"
                  value={editIngredientAmount}
                  onChange={(e) =>
                    setEditIngredientAmount(
                      e.target.value
                    )
                  }
                  placeholder="数量"
                  className="min-h-12 rounded-xl border p-3"
                />

                <select
                  value={editIngredientUnit}
                  onChange={(e) =>
                    setEditIngredientUnit(
                      e.target.value
                    )
                  }
                  className="min-h-12 rounded-xl border p-3"
                >
                  <option value="個">個</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="本">本</option>
                  <option value="枚">枚</option>
                  <option value="杯">杯</option>
                  <option value="袋">袋</option>
                  <option value="パック">パック</option>
                </select>

              </div>

              <button
                onClick={addEditIngredient}
                className="mt-3 min-h-12 rounded-xl bg-gray-800 px-5 py-3 font-bold text-white"
              >
                ＋ 食材を追加
              </button>

            </div>

            <button
              onClick={saveEditedRecipe}
              disabled={
                editRecipeName.trim() === "" ||
                editIngredients.length === 0
              }
              className="mt-6 min-h-12 w-full rounded-xl bg-blue-600 p-3 font-bold text-white disabled:bg-gray-300"
            >
              変更を保存する
            </button>

          </div>
        )}

        {/* 選択したレシピ */}
        <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

          <h2 className="text-lg font-bold">
            選択したレシピ
          </h2>

          {selectedRecipe.length === 0 ? (
            <p className="mt-3 text-gray-500">
              まだ選択されていません
            </p>
          ) : (
            <ul className="mt-3 space-y-2">

              {selectedRecipe.map(
                (recipe) => (
                  <li
                    key={recipe}
                    className="rounded-xl bg-blue-50 p-3 font-medium text-blue-700"
                  >
                    ✓ {recipe}
                  </li>
                )
              )}

            </ul>
          )}

          <button
            onClick={createShoppingList}
            disabled={
              selectedRecipe.length === 0
            }
            className="mt-5 min-h-12 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm disabled:bg-gray-300"
          >
            {people}
            人分の買い物リストを作る
          </button>

        </div>

        {/* 買い物リスト */}
        {shoppingList.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-lg font-bold">
                  🛒 買い物リスト
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {people}人分・
                  {shoppingList.length}種類
                </p>

              </div>

            </div>

            {/* 手動追加 */}
            <button
              onClick={() =>
                setShowAddShoppingItem(
                  !showAddShoppingItem
                )
              }
              className="mt-4 min-h-12 w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-3 font-bold text-blue-600 hover:bg-blue-100"
            >
              ＋ 食材を追加
            </button>

            {showAddShoppingItem && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">

                <h3 className="font-bold">
                  🛒 買い物リストに追加
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">

                  <input
                    value={shoppingItemName}
                    onChange={(e) =>
                      setShoppingItemName(
                        e.target.value
                      )
                    }
                    placeholder="例：牛乳"
                    className="min-h-12 rounded-xl border bg-white p-3"
                  />

                  <input
                    type="number"
                    value={shoppingItemAmount}
                    onChange={(e) =>
                      setShoppingItemAmount(
                        e.target.value
                      )
                    }
                    placeholder="数量"
                    className="min-h-12 rounded-xl border bg-white p-3"
                  />

                  <select
                    value={shoppingItemUnit}
                    onChange={(e) =>
                      setShoppingItemUnit(
                        e.target.value
                      )
                    }
                    className="min-h-12 rounded-xl border bg-white p-3"
                  >
                    <option value="個">個</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="本">本</option>
                    <option value="枚">枚</option>
                    <option value="杯">杯</option>
                    <option value="袋">袋</option>
                    <option value="パック">パック</option>
                  </select>

                </div>

                <button
                  onClick={addShoppingItem}
                  disabled={
                    shoppingItemName.trim() === "" ||
                    shoppingItemAmount === ""
                  }
                  className="mt-3 min-h-12 w-full rounded-xl bg-blue-600 p-3 font-bold text-white disabled:bg-gray-300"
                >
                  追加する
                </button>

              </div>
            )}

            {/* 操作ボタン */}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">

              <button
                onClick={copyShoppingList}
                className="min-h-12 rounded-xl bg-blue-600 p-3 font-bold text-white hover:bg-blue-700"
              >
                📋 リストをコピー
              </button>

              <button
                onClick={checkAll}
                className="min-h-12 rounded-xl bg-gray-100 p-3 font-bold text-gray-700 hover:bg-gray-200"
              >
                ☑️ 全部チェック
              </button>

              <button
                onClick={uncheckAll}
                className="min-h-12 rounded-xl bg-gray-100 p-3 font-bold text-gray-700 hover:bg-gray-200"
              >
                🔄 チェックを外す
              </button>

              <button
                onClick={completeShopping}
                className="min-h-12 rounded-xl bg-red-50 p-3 font-bold text-red-600 hover:bg-red-100"
              >
                🗑️ 買い物完了
              </button>

            </div>

            {copyMessage && (
              <p className="mt-3 text-center text-sm font-bold text-green-600">
                {copyMessage}
              </p>
            )}

            {/* 買い物リスト */}
            <ul className="mt-4 space-y-2">

              {shoppingList.map(
                (ingredient) => {

                  const isChecked =
                    checkedItems.includes(
                      ingredient.name
                    );

                  return (
                    <li
                      key={`${ingredient.name}-${ingredient.unit}`}
                      className="flex items-center gap-2"
                    >

                      <button
                        onClick={() =>
                          toggleChecked(
                            ingredient.name
                          )
                        }
                        className="flex min-h-14 min-w-0 flex-1 items-center justify-between rounded-xl bg-gray-50 p-4 text-left hover:bg-gray-100"
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          <span className="text-2xl">
                            {isChecked
                              ? "☑"
                              : "☐"}
                          </span>

                          <span
                            className={`truncate ${
                              isChecked
                                ? "text-gray-400 line-through"
                                : "font-medium"
                            }`}
                          >
                            {ingredient.name}
                          </span>

                        </div>

                        <span
                          className={`ml-3 whitespace-nowrap ${
                            isChecked
                              ? "text-gray-400 line-through"
                              : "font-bold"
                          }`}
                        >
                          {ingredient.amount}
                          {ingredient.unit}
                        </span>

                      </button>

                      <button
                        onClick={() =>
                          removeShoppingItem(
                            ingredient.name,
                            ingredient.unit
                          )
                        }
                        className="flex min-h-14 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                        aria-label={`${ingredient.name}を削除`}
                      >
                        🗑️
                      </button>

                    </li>
                  );
                }
              )}

            </ul>

            {/* 買い物進捗 */}
            <div className="mt-5">

              <div className="flex justify-between text-sm">

                <span className="text-gray-500">
                  買い物進捗
                </span>

                <span className="font-bold">
                  {checkedItems.length} /{" "}
                  {shoppingList.length}
                </span>

              </div>

              <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">

                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${
                      shoppingList.length === 0
                        ? 0
                        : (checkedItems.length /
                            shoppingList.length) *
                          100
                    }%`,
                  }}
                />

              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}