import { TimeIntervalFilterPattern } from "@druid-toolkit/query";
import { Calendar } from "primereact/calendar";
import { memo, useMemo, useCallback, useState } from "react";

interface AbsoluteTimeClauseEditorProps {
  pattern: TimeIntervalFilterPattern;
  onChange: (pattern: TimeIntervalFilterPattern) => void;
}

export const AbsoluteTimeClauseEditor = memo(function AbsoluteTimeClauseEditor(
  props: AbsoluteTimeClauseEditorProps
) {
  const { pattern, onChange } = props;

  const [dates, setDates] = useState([
    pattern.start ?? new Date(),
    pattern.end ?? new Date(),
  ]);

  const onHide = useCallback(() => {
    onChange({
      ...pattern,
      start: dates[0],
      end: dates[1],
    });
  }, [onChange, pattern, dates]);

  return (
    <Calendar
      value={dates}
      onChange={(e) => setDates(e.value as any)}
      onHide={onHide}
      selectionMode="range"
      readOnlyInput
    />
  );
});
