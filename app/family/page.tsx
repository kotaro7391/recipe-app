"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Household = {
  id: string;
  name: string;
  invite_code: string | null;
};

export default function FamilyPage() {
  const router = useRouter();

  const [household, setHousehold] = useState<Household | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");

  // ========================================
  // 自分の家族情報を読み込み
  // ========================================
  useEffect(() => {
    const loadFamily = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        // 自分のプロフィールからhousehold_idを取得
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("household_id")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error(profileError);
          setMessage("家族情報の取得に失敗しました");
          return;
        }

        if (!profile?.household_id) {
          setMessage("家族情報が見つかりません");
          return;
        }

        // 家族情報を取得
        const { data: householdData, error: householdError } =
          await supabase
            .from("households")
            .select("id, name, invite_code")
            .eq("id", profile.household_id)
            .single();

        if (householdError) {
          console.error(householdError);
          setMessage("家族情報の取得に失敗しました");
          return;
        }

        setHousehold(householdData);
      } finally {
        setLoading(false);
      }
    };

    loadFamily();
  }, [router]);

  // ========================================
  // 家族コードで参加
  // ========================================
  const joinFamily = async () => {
    const code = inviteCode.trim();

    if (!code) {
      setMessage("家族コードを入力してください");
      return;
    }

    setJoining(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "join_household_by_code",
        {
          input_invite_code: code,
        }
      );

      if (error) {
        console.error(error);
        setMessage("家族への参加に失敗しました");
        return;
      }

      if (!data) {
        setMessage("家族コードが正しくありません");
        return;
      }

      setMessage("家族に参加しました！");

      // 最新の家族情報を読み直す
      window.location.reload();
    } finally {
      setJoining(false);
    }
  };

  // ========================================
  // ログアウト
  // ========================================
  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-lg">
        {/* ヘッダー */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                家族設定
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                レシピと買い物リストを家族で共有
              </p>
            </div>

            <button
              onClick={() => router.push("/")}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              レシピへ
            </button>
          </div>
        </div>

        {/* 現在の家族 */}
        {household && (
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              {household.name}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              この家族コードを共有すると、家族を追加できます。
            </p>

            <div className="mt-4 rounded-2xl bg-gray-50 p-5 text-center">
              <p className="text-sm text-gray-500">
                家族コード
              </p>

              <p className="mt-2 text-3xl font-bold tracking-widest text-gray-900">
                {household.invite_code ?? "未設定"}
              </p>
            </div>

            {household.invite_code && (
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      household.invite_code!
                    );
                    setMessage("家族コードをコピーしました！");
                  } catch {
                    setMessage("コピーできませんでした");
                  }
                }}
                className="mt-4 w-full rounded-xl bg-gray-900 py-3 font-medium text-white hover:bg-gray-800"
              >
                家族コードをコピー
              </button>
            )}
          </div>
        )}

        {/* 家族コードで参加 */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            家族に参加
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            家族から教えてもらった8桁のコードを入力してください。
          </p>

          <input
            type="text"
            value={inviteCode}
            onChange={(e) =>
              setInviteCode(e.target.value.toUpperCase())
            }
            placeholder="例：AB12CD34"
            maxLength={8}
            className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-lg font-bold tracking-widest outline-none focus:ring-2 focus:ring-gray-400"
          />

          <button
            onClick={joinFamily}
            disabled={joining}
            className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {joining ? "参加中..." : "この家族に参加する"}
          </button>
        </div>

        {/* メッセージ */}
        {message && (
          <div className="mb-6 rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-700">
            {message}
          </div>
        )}

        {/* ログアウト */}
        <button
          onClick={logout}
          className="w-full rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ログアウト
        </button>
      </div>
    </main>
  );
}