/**
 * AIの問題の品質確認用。指定した学年で1回ぶんの問題を作って表示する（DBには保存しない）。
 * 使い方: npm run sample -- 2   （保育園は 0）
 *         npm run sample -- 5 3 pre2   （学年 レベル 英検の級）
 */
import { generateQuestions } from "@/lib/ai/generate";
import { courseUnits, eikenLabel, parseEikenGrade } from "@/lib/curriculum/eiken";
import type { Subject } from "@/lib/curriculum/units";
import { INITIAL_SUBJECT_LEVEL, parseGrade } from "@/lib/game/player";
import { pickUnits, questSubjects } from "@/lib/game/quest";
import { validateQuestion } from "@/lib/game/question";

const grade = parseGrade(process.argv[2] ?? "2");
if (grade === null) throw new Error("学年は 0（保育園）〜6 で指定してください");
const level = Number(process.argv[3] ?? INITIAL_SUBJECT_LEVEL);
const eiken = parseEikenGrade(process.argv[4]);

const subjects = questSubjects(grade);
const count = (s: Subject) => subjects.filter((x) => x === s).length;
const picked = new Map([...new Set(subjects)].map((s) => [s, pickUnits(courseUnits(grade, s, eiken), new Map(), count(s))]));
const slots = subjects.map((subject) => ({ subject, unit: picked.get(subject)!.shift()!, difficulty: level }));

const started = Date.now();
const result = await generateQuestions({ grade, levels: { math: level, english: level, japanese: level, science: level }, eiken, slots, recentPrompts: [] });
const seconds = ((Date.now() - started) / 1000).toFixed(1);

console.log(`# ${grade === 0 ? "保育園" : `${grade}年生`}${eiken ? ` / 英語は${eikenLabel(eiken)}` : ""} / レベル${level}: ${seconds}秒, リクエスト${result.requests}回, AI ${result.aiCount}/${slots.length}問\n`);
result.questions.forEach((q, i) => {
  console.log(`[${i}] ${q.subject} ${q.unit} (${q.format}, ${q.source})`);
  console.log(`  問題: ${q.prompt}`);
  if (q.choices.length) console.log(`  選択肢: ${q.choices.join(" / ")}`);
  console.log(`  正解: ${q.answer}${q.expression ? `  (式: ${q.expression})` : ""}${q.speech ? `  読み上げ: "${q.speech}"` : ""}`);
  console.log(`  ヒント: ${q.hint}`);
  console.log(`  解説: ${q.explanation}`);
  const errors = validateQuestion(q, grade);
  if (errors.length) console.log(`  ⚠ ${errors.join(", ")}`);
});
if (result.rejected.length) {
  console.log("\n# 検証で落ちた問題");
  for (const r of result.rejected) console.log(`- slot ${r.slot}: ${r.prompt}\n    ${r.errors.join(", ")}`);
}
if (result.failures.length) console.log("\n# APIの失敗\n" + result.failures.map((f) => `- ${f}`).join("\n"));
