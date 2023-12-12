import {
  SqlExpression,
  fitFilterPatterns,
  filterPatternToExpression,
} from "@druid-toolkit/query";
import { memo, useCallback } from "react";
import { AbsoluteTimeClauseEditor } from "./absolute-time-clause-editor";
import { RelativeTimeClauseEditor } from "./relative-time-clause-editor";
import { DateTime, Duration } from "luxon";
import { InputSwitch, InputSwitchChangeEvent } from "primereact/inputswitch";
import styled from "@emotion/styled";

const WhereEditor = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
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
    (e: InputSwitchChangeEvent) => {
      if (e.value) {
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
      <InputSwitch
        checked={timeClause.type === "timeRelative"}
        onChange={onTypeChange}
      />
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
    </WhereEditor>
  );
});
