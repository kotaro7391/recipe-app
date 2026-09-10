"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdatePassword = async () => {
    if (!password || !passwordConfirm) {
      setMessage("パスワードを入力してください");
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("パスワードが一致していません");
      return;
    }

    if (password.length < 6) {
      setMessage("パスワードは6文字以上にしてください");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("パスワードを変更しました！");

    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-center mb-2">
          パスワード再設定
        </h1>

        <p className="text-sm text-gray-500 text-center mb-6">
          新しいパスワードを入力してください
        </p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="新しいパスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="新しいパスワード（確認）"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "変更中..." : "パスワードを変更する"}
          </button>

          {message && (
            <p className="text-sm text-center text-gray-600">
              {message}
            </p>
          )}

          <button
            onClick={() => router.push("/login")}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    </main>
  );
}