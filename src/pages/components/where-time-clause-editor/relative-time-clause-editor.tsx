import { TimeRelativeFilterPattern } from "@druid-toolkit/query";
import { memo, useCallback, useMemo } from "react";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";

interface RelativeTimeClauseEditorProps {
  pattern: TimeRelativeFilterPattern;
  onChange: (pattern: TimeRelativeFilterPattern) => void;
}

export const RelativeTimeClauseEditor = memo(function RelativeTimeClauseEditor(
  props: RelativeTimeClauseEditorProps
) {
  const { pattern, onChange } = props;

  const onDurationChange = useCallback(
    (e: DropdownChangeEvent) => {
      onChange({
        ...pattern,
        rangeDuration: e.target.value,
      });
    },
    [pattern, onChange]
  );

  const options = useMemo(() => {
    return [
      { label: "Last 6 hours", value: "PT6H" },
      { label: "Last day", value: "P1D" },
      { label: "Last week", value: "P1W" },
      { label: "Last month", value: "P1M" },
      { label: "Last year", value: "P1Y" },
    ];
  }, []);

  return (
    <Dropdown
      value={pattern.rangeDuration}
      onChange={onDurationChange}
      options={options}
      optionLabel="label"
    />
  );
});
