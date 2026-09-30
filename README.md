# 勉強クエスト

ノックといっしょにモンスターを倒しながら、算数と英語を毎日勉強するドット絵RPG風の学習ゲーム。

## 開発

```bash
cp .env.example .env.local   # 値を設定
npm install
npm run db:migrate
npm run dev
```

- `npm test` — ロジックのユニットテスト
- `npm run db:generate` — スキーマ変更後にマイグレーションを生成

## 素材

- ノック: `public/assets/knock/*.png`（308×429の透過PNG・10表情: neutral / waving / cheering / love / winking / confused / surprised / angry / crying / sleepy）。使い分けは `src/components/Knock.tsx` 参照
