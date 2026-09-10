"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ========================================
  // ログイン・新規登録
  // ========================================
  const handleSubmit = async () => {
    setMessage("");

    if (!email || !password) {
      setMessage("メールアドレスとパスワードを入力してください");
      return;
    }

    if (password.length < 6) {
      setMessage("パスワードは6文字以上にしてください");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // 新規登録
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        if (!data.session) {
          setMessage(
            "登録しました。メールを確認してからログインしてください。"
          );
          return;
        }

        router.push("/");
      } else {
        // ログイン
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(
            "メールアドレスまたはパスワードが間違っています"
          );
          return;
        }

        router.push("/");
      }
    } catch {
      setMessage("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // パスワードリセットメール送信
  // ========================================
  const handleResetPassword = async () => {
    setMessage("");

    if (!email) {
      setMessage("メールアドレスを入力してください");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        "パスワードリセット用のメールを送信しました。メールを確認してください。"
      );
    } catch {
      setMessage("メールの送信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 sm:p-8">

        {/* タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">
            レシピ買い出しアプリ
          </h1>

          <p className="text-sm text-zinc-500 mt-2">
            {isForgotPassword
              ? "パスワードをリセット"
              : isSignUp
              ? "アカウントを作成"
              : "ログイン"}
          </p>
        </div>

        {/* ================================ */}
        {/* パスワードリセット画面 */}
        {/* ================================ */}
        {isForgotPassword ? (
          <div className="space-y-4">

            <p className="text-sm text-zinc-600">
              登録しているメールアドレスを入力してください。
              パスワード再設定用のメールを送ります。
            </p>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                メールアドレス
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            {message && (
              <div className="bg-zinc-100 rounded-xl p-3 text-sm text-zinc-700">
                {message}
              </div>
            )}

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-zinc-900 text-white rounded-xl py-3 font-medium hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading
                ? "送信中..."
                : "パスワードリセットメールを送る"}
            </button>

            <button
              onClick={() => {
                setIsForgotPassword(false);
                setMessage("");
              }}
              className="w-full text-sm text-blue-600 hover:underline py-2"
            >
              ログイン画面に戻る
            </button>
          </div>
        ) : (
          /* ================================ */
          /* ログイン・新規登録画面 */
          /* ================================ */
          <>
            <div className="space-y-4">

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  メールアドレス
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              {/* パスワード */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  パスワード
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6文字以上"
                  className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              {/* メッセージ */}
              {message && (
                <div className="bg-zinc-100 rounded-xl p-3 text-sm text-zinc-700">
                  {message}
                </div>
              )}

              {/* ログイン・登録 */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-zinc-900 text-white rounded-xl py-3 font-medium hover:bg-zinc-800 disabled:opacity-50"
              >
                {loading
                  ? "処理中..."
                  : isSignUp
                  ? "アカウントを作成"
                  : "ログイン"}
              </button>
            </div>

            {/* パスワード忘れ */}
            {!isSignUp && (
              <div className="text-center mt-4">
                <button
                  onClick={() => {
                    setIsForgotPassword(true);
                    setMessage("");
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  パスワードを忘れた方はこちら
                </button>
              </div>
            )}

            {/* 新規登録・ログイン切り替え */}
            <div className="text-center mt-6">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage("");
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                {isSignUp
                  ? "すでにアカウントをお持ちの方はこちら"
                  : "初めて使う方はこちら（新規登録）"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}