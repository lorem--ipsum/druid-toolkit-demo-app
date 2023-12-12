import { Select } from "@chakra-ui/react";
import { TimeRelativeFilterPattern } from "@druid-toolkit/query";
import { memo, useCallback } from "react";

interface RelativeTimeClauseEditorProps {
  pattern: TimeRelativeFilterPattern;
  onChange: (pattern: TimeRelativeFilterPattern) => void;
}

export const RelativeTimeClauseEditor = memo(function RelativeTimeClauseEditor(
  props: RelativeTimeClauseEditorProps
) {
  const { pattern, onChange } = props;

  const onDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({
        ...pattern,
        rangeDuration: e.target.value,
      });
    },
    [pattern, onChange]
  );

  return (
    <Select
      width="200px"
      size="sm"
      value={pattern.rangeDuration}
      onChange={onDurationChange}
    >
      <option value="PT6H">Last 6 hours</option>
      <option value="P1D">Last day</option>
      <option value="P1W">Last week</option>
      <option value="P1M">Last month</option>
      <option value="P1Y">Last year</option>
    </Select>
  );
});
