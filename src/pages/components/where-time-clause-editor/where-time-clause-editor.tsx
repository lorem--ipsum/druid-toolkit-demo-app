import {
  SqlExpression,
  fitFilterPatterns,
  filterPatternToExpression,
} from "@druid-toolkit/query";
import { memo } from "react";
import { AbsoluteTimeClauseEditor } from "./absolute-time-clause-editor";
import { RelativeTimeClauseEditor } from "./relative-time-clause-editor";

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

  if (timeClause?.type === "timeInterval") {
    return (
      <AbsoluteTimeClauseEditor
        pattern={timeClause}
        onChange={(pattern) => {
          onChange(filterPatternToExpression(pattern));
        }}
      />
    );
  }

  if (timeClause?.type === "timeRelative") {
    return (
      <RelativeTimeClauseEditor
        pattern={timeClause}
        onChange={(pattern) => {
          onChange(filterPatternToExpression(pattern));
        }}
      />
    );
  }
});
