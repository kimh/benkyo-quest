"use client";

import { useState } from "react";
import { PixelButton } from "@/components/PixelButton";
import { EIKEN_GRADES, EIKEN_SCOPE, eikenLabel, parseEikenGrade, type EikenGrade } from "@/lib/curriculum/eiken";
import { INITIAL_SUBJECT_LEVEL } from "@/lib/game/player";
import { updateEnglishCourse } from "../../actions";

type Props = { playerId: number; saved: EikenGrade | null; gradeName: string };

/** 英語のコースの選択。選んだ級の説明は、保存する前から切り替えて見せる */
export function EnglishCourseForm({ playerId, saved, gradeName }: Props) {
  const [selected, setSelected] = useState<string>(saved ?? "school");
  const eiken = parseEikenGrade(selected);
  const changed = selected !== (saved ?? "school");

  return (
    <form action={updateEnglishCourse} className="rpg-window flex flex-col gap-2 p-3">
      <input type="hidden" name="playerId" value={playerId} />
      <span className="flex items-center justify-between gap-3">
        <select
          name="course"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="英語のコース"
          className="flex-1 border-2 border-white bg-black px-2 py-1"
        >
          <option value="school">学年どおり（{gradeName}）</option>
          {EIKEN_GRADES.map((g) => (
            <option key={g} value={g}>
              {eikenLabel(g)}
            </option>
          ))}
        </select>
        <PixelButton type="submit" className="min-h-10 px-3 py-1 text-base" disabled={!changed}>
          変更
        </PixelButton>
      </span>
      <span className="text-sm text-white/70">{eiken ? EIKEN_SCOPE[eiken] : "小学校の学年の英語の範囲"}</span>
      {changed && (
        <span className="text-sm text-accent">変更すると、英語のレベルは Lv {INITIAL_SUBJECT_LEVEL} にもどります。</span>
      )}
    </form>
  );
}
