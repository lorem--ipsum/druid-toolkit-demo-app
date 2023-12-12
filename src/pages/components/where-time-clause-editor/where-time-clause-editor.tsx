import {
  SqlExpression,
  fitFilterPatterns,
  filterPatternToExpression,
} from "@druid-toolkit/query";
import { memo, useCallback } from "react";
import { AbsoluteTimeClauseEditor } from "./absolute-time-clause-editor";
import { RelativeTimeClauseEditor } from "./relative-time-clause-editor";
import { FormControl, FormLabel, Switch } from "@chakra-ui/react";
import { DateTime, Duration } from "luxon";
import styled from "@emotion/styled";

const WhereEditor = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

interface WhereTimeClauseEditorProps {
  timeColumn: string;
  where: SqlExpression;
  onChange: (where: SqlExpression) => void;
}

export const WhereTimeClauseEditor = memo(function WhereTimeClauseEditor(
  props: WhereTimeClauseEditorProps
) {
  const { where, timeColumn, onChange } = props;

  const timeClause = fitFilterPatterns(where).filter((pattern) => {
    if (pattern.type !== "timeInterval" && pattern.type !== "timeRelative")
      return false;

    return pattern.column === timeColumn;
  })[0];

  const onTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.checked;

      if (newValue) {
        onChange(
          filterPatternToExpression({
            type: "timeRelative",
            column: timeColumn,
            rangeDuration: "P1D",
            negated: false,
            anchor: "currentTimestamp",
          })
        );
      } else {
        const duration = Duration.fromISO(
          timeClause?.type === "timeRelative" ? timeClause.rangeDuration : "P1D"
        );
        const end = DateTime.now();
        const start = end.minus(duration);

        onChange(
          filterPatternToExpression({
            type: "timeInterval",
            column: timeColumn,
            start: start.toJSDate(),
            end: end.toJSDate(),
            negated: false,
          })
        );
      }
    },
    [onChange, timeColumn, timeClause]
  );

  if (!timeClause) return null;

  return (
    <WhereEditor>
      <FormControl display="flex" alignItems="center" width="200px">
        <FormLabel htmlFor="relative-time" mb="0">
          Relative time filter
        </FormLabel>
        <Switch
          id="relative-time"
          size="sm"
          isChecked={timeClause.type === "timeRelative"}
          onChange={onTypeChange}
        />
      </FormControl>
      <FormControl display="flex" alignItems="center" width="200px">
        {timeClause.type === "timeInterval" && (
          <AbsoluteTimeClauseEditor
            pattern={timeClause}
            onChange={(pattern) => {
              onChange(filterPatternToExpression(pattern));
            }}
          />
        )}
        {timeClause.type === "timeRelative" && (
          <RelativeTimeClauseEditor
            pattern={timeClause}
            onChange={(pattern) => {
              onChange(filterPatternToExpression(pattern));
            }}
          />
        )}
      </FormControl>
    </WhereEditor>
  );
});
