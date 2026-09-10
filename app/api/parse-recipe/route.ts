import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // ========================================
    // 1. APIキー確認
    // ========================================
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY が設定されていません");

      return NextResponse.json(
        {
          error:
            "OpenAI APIキーが設定されていません。.env.localを確認してください。",
        },
        { status: 500 }
      );
    }

    // ========================================
    // 2. リクエスト取得
    // ========================================
    const body = await request.json();

    const url = body.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          error: "レシピURLを入力してください",
        },
        { status: 400 }
      );
    }

    // ========================================
    // 3. URL確認
    // ========================================
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          error: "正しいURLを入力してください",
        },
        { status: 400 }
      );
    }

    console.log("レシピURL取得開始:", url);

    // ========================================
    // 4. レシピページ取得
    // ========================================
    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        cache: "no-store",
      });
    } catch (fetchError) {
      console.error(
        "レシピページの取得エラー:",
        fetchError
      );

      return NextResponse.json(
        {
          error:
            "レシピページにアクセスできませんでした。URLを確認してください。",
        },
        { status: 400 }
      );
    }

    console.log(
      "レシピページ取得結果:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `レシピページを取得できませんでした（HTTP ${response.status}）`,
        },
        { status: 400 }
      );
    }

    // ========================================
    // 5. HTML取得
    // ========================================
    const html = await response.text();

    console.log(
      "HTML取得完了:",
      html.length,
      "文字"
    );

    if (!html.trim()) {
      return NextResponse.json(
        {
          error:
            "レシピページから文章を取得できませんでした。",
        },
        { status: 400 }
      );
    }

    // ========================================
    // 6. HTML → テキスト
    // ========================================
    const pageText = html
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        " "
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        " "
      )
      .replace(
        /<noscript[\s\S]*?<\/noscript>/gi,
        " "
      )
      .replace(
        /<[^>]+>/g,
        " "
      )
      .replace(
        /&nbsp;/gi,
        " "
      )
      .replace(
        /&amp;/gi,
        "&"
      )
      .replace(
        /&lt;/gi,
        "<"
      )
      .replace(
        /&gt;/gi,
        ">"
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim()
      .slice(0, 50000);

    console.log(
      "レシピページのテキスト:",
      pageText.slice(0, 500)
    );

    if (!pageText) {
      return NextResponse.json(
        {
          error:
            "レシピページから文章を取得できませんでした。",
        },
        { status: 400 }
      );
    }

    // ========================================
    // 7. OpenAIに送信
    // ========================================
    console.log("OpenAI APIへ送信開始");

    let completion;

    try {
      completion =
        await openai.chat.completions.create({
          model: "gpt-5.4-mini",

          response_format: {
            type: "json_object",
          },

          messages: [
            {
              role: "system",
              content: `
あなたは料理レシピ解析AIです。

与えられたWebページの文章から、料理レシピの情報を抽出してください。

必ず以下のJSON形式で返してください。

{
  "name": "レシピ名",
  "category": "主菜",
  "ingredients": [
    {
      "name": "食材名",
      "amount": 300,
      "unit": "g"
    }
  ]
}

categoryは必ず以下のどれかにしてください。

「主菜」
「副菜」
「その他」

ルール：

- レシピ名を抽出する
- 材料・調味料をできるだけ漏れなく抽出する
- 手順や説明文はingredientsに入れない
- 材料に書かれている数量を正確に取得する
- 数量が書かれていない場合はamountを1にする
- 「少々」「適量」など数量化できないものはamountを1にする
- 単位がない場合はunitを「適量」にする
- 「大さじ」は「大さじ」
- 「小さじ」は「小さじ」
- 「1/2個」のような分数は0.5として扱う
- レシピ名が分からない場合は「未設定」
- カテゴリーが判断できない場合は「その他」
- 材料名に数量や単位を含めない
- JSON以外の文章は絶対に返さない
              `,
            },
            {
              role: "user",
              content: `
以下はレシピページの文章です。

${pageText}
              `,
            },
          ],
        });
    } catch (openaiError: unknown) {
      console.error(
        "OpenAI APIエラー:",
        openaiError
      );

      let errorMessage =
        "OpenAI APIでエラーが発生しました。";

      if (
        openaiError &&
        typeof openaiError === "object" &&
        "message" in openaiError
      ) {
        const message = String(
          (openaiError as { message: unknown }).message
        );

        errorMessage =
          `OpenAI APIエラー: ${message}`;
      }

      return NextResponse.json(
        {
          error: errorMessage,
        },
        { status: 500 }
      );
    }

    // ========================================
    // 8. AI結果取得
    // ========================================
    const result =
      completion.choices[0]?.message?.content;

    console.log(
      "OpenAI API結果:",
      result
    );

    if (!result) {
      return NextResponse.json(
        {
          error:
            "AIからレシピ情報を取得できませんでした。",
        },
        { status: 500 }
      );
    }

    // ========================================
    // 9. JSON解析
    // ========================================
    let parsed;

    try {
      parsed = JSON.parse(result);
    } catch (jsonError) {
      console.error(
        "AI結果のJSON解析エラー:",
        jsonError
      );

      console.error(
        "AIが返した内容:",
        result
      );

      return NextResponse.json(
        {
          error:
            "AIから正しいレシピデータを取得できませんでした。",
        },
        { status: 500 }
      );
    }

    // ========================================
    // 10. データ確認
    // ========================================
    if (
      !parsed.name ||
      !Array.isArray(parsed.ingredients)
    ) {
      console.error(
        "AI結果の形式が不正:",
        parsed
      );

      return NextResponse.json(
        {
          error:
            "AIが正しいレシピ情報を返しませんでした。",
        },
        { status: 500 }
      );
    }

    // ========================================
    // 11. 食材データを整形
    // ========================================
    const ingredients = parsed.ingredients
      .filter(
        (ingredient: {
          name?: unknown;
        }) =>
          typeof ingredient.name === "string" &&
          ingredient.name.trim() !== ""
      )
      .map(
        (ingredient: {
          name: string;
          amount?: unknown;
          unit?: unknown;
        }) => {
          const amount = Number(
            ingredient.amount
          );

          return {
            name: ingredient.name.trim(),

            amount:
              Number.isFinite(amount) &&
              amount > 0
                ? amount
                : 1,

            unit:
              typeof ingredient.unit ===
              "string"
                ? ingredient.unit
                : "適量",
          };
        }
      );

    // ========================================
    // 12. 最終結果
    // ========================================
    const recipe = {
      name:
        typeof parsed.name === "string"
          ? parsed.name
          : "未設定",

      category:
        parsed.category === "主菜" ||
        parsed.category === "副菜"
          ? parsed.category
          : "その他",

      ingredients,
    };

    console.log(
      "レシピ解析成功:",
      recipe
    );

    return NextResponse.json({
      success: true,
      recipe,
    });
  } catch (error: unknown) {
    console.error(
      "レシピ解析API全体エラー:",
      error
    );

    let errorMessage =
      "レシピの解析に失敗しました。";

    if (
      error &&
      typeof error === "object" &&
      "message" in error
    ) {
      errorMessage = String(
        (error as { message: unknown }).message
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}