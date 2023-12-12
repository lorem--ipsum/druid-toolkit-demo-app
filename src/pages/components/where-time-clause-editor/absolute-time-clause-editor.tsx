import "@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css";
import "react-calendar/dist/Calendar.css";
import { TimeIntervalFilterPattern } from "@druid-toolkit/query";
import dynamic from "next/dynamic";
// importing this directly doesn't play well with Next's SSR ¯\_(ツ)_/¯
const DateRangePicker = dynamic(
  () => import("@wojtekmaj/react-daterange-picker"),
  { ssr: false }
);
import { Value } from "@wojtekmaj/react-daterange-picker/dist/cjs/shared/types";
import { memo, useMemo, useCallback } from "react";

interface AbsoluteTimeClauseEditorProps {
  pattern: TimeIntervalFilterPattern;
  onChange: (pattern: TimeIntervalFilterPattern) => void;
}

export const AbsoluteTimeClauseEditor = memo(function AbsoluteTimeClauseEditor(
  props: AbsoluteTimeClauseEditorProps
) {
  const { pattern, onChange } = props;

  const value = useMemo<[Date, Date]>(
    () => [pattern.start ?? new Date(), pattern.end ?? new Date()],
    [pattern.start, pattern.end]
  );

  const onValuesChange = useCallback(
    (value: Value) => {
      if (Array.isArray(value)) {
        onChange({
          ...pattern,
          start: value[0] ?? new Date(),
          end: value[1] ?? new Date(),
        });
      } else {
        onChange({
          ...pattern,
          start: value ?? new Date(),
          end: value ?? new Date(),
        });
      }
    },
    [pattern, onChange]
  );

  return <DateRangePicker onChange={onValuesChange} value={value} />;
});
