import {
  SqlExpression,
  fitFilterPatterns,
  filterPatternToExpression,
} from "@druid-toolkit/query";
import {
  ComponentProps,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import styled from "@emotion/styled";
import { DateTime, Duration } from "luxon";

const DURATIONS = [
  { label: "Last 6 hours", value: "PT6H" },
  { label: "Last day", value: "P1D" },
  { label: "Last week", value: "P1W" },
  { label: "Last month", value: "P1M" },
  { label: "Last year", value: "P1Y" },
];

const TIMEZONES = [
  { label: "UTC", value: "Etc/UTC" },
  { label: "America/Los_Angeles", value: "America/Los_Angeles" },
  { label: "America/New_York", value: "America/New_York" },
  { label: "Europe/London", value: "Europe/London" },
  { label: "Europe/Berlin", value: "Europe/Berlin" },
  { label: "Asia/Shanghai", value: "Asia/Shanghai" },
  { label: "Asia/Tokyo", value: "Asia/Tokyo" },
];

const WhereEditor = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
`;

interface WhereTimeClauseEditorProps {
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
  timeColumn: string;
  where: SqlExpression;
  onChange: (where: SqlExpression) => void;
}

export const WhereTimeClauseEditor = memo(function WhereTimeClauseEditor(
  props: WhereTimeClauseEditorProps
) {
  const { where, timeColumn, onChange, timezone, onTimezoneChange } = props;

  const timeClause = useMemo(
    () =>
      fitFilterPatterns(where).filter((pattern) => {
        if (pattern.type !== "timeInterval" && pattern.type !== "timeRelative")
          return false;

        return pattern.column === timeColumn;
      })[0],
    [where, timeColumn]
  );

  const [dates, setDates] = useState(() => {
    if (timeClause.type === "timeInterval") {
      return [timeClause.start ?? new Date(), timeClause.end ?? new Date()];
    }

    return [];
  });

  useEffect(() => {
    if (timeClause?.type === "timeInterval") {
      setDates([timeClause.start ?? new Date(), timeClause.end ?? new Date()]);
    }
  }, [timeClause, timezone]);

  const previewDates = useMemo(() => {
    if (timeClause?.type === "timeRelative") {
      const end = DateTime.now().setZone(timezone);
      const start = end.minus(Duration.fromISO(timeClause.rangeDuration));

      return [start.toJSDate(), end.toJSDate()];
    }

    return [];
  }, [timeClause, timezone]);

  const onCalendarHide = useCallback(() => {
    if (dates.length !== 2) return;

    onChange(
      filterPatternToExpression({
        type: "timeInterval",
        column: timeColumn,
        start: dates[0],
        end: dates[1],
        negated: timeClause.negated,
      })
    );
  }, [onChange, timeClause, timeColumn, dates]);

  const onDurationChange = useCallback(
    (e: DropdownChangeEvent) => {
      onChange(
        filterPatternToExpression({
          type: "timeRelative",
          column: timeColumn,
          rangeDuration: e.target.value,
          anchor: "currentTimestamp",
          negated: timeClause.negated,
        })
      );
      setDates([]);
    },
    [timeClause, timeColumn, onChange]
  );

  if (!timeClause) return null;

  return (
    <WhereEditor>
      <Dropdown
        style={{ width: 160 }}
        value={
          timeClause.type === "timeRelative"
            ? timeClause.rangeDuration
            : undefined
        }
        placeholder="-"
        onChange={onDurationChange}
        options={DURATIONS}
        optionLabel="label"
      />
      <Calendar
        style={{ width: 360 }}
        value={dates.length === 2 ? dates : previewDates}
        onChange={(e) => setDates(e.value as any)}
        formatDateTime={(date) => {
          return DateTime.fromJSDate(date)
            .setZone(timezone)
            .toFormat("yyyy-MM-dd HH:mm:ss");
        }}
        parseDateTime={(dateString) => {
          return DateTime.fromFormat(dateString, "yyyy-MM-dd HH:mm:ss", {
            zone: timezone,
          }).toJSDate();
        }}
        onHide={onCalendarHide}
        selectionMode="range"
      />
      <Dropdown
        style={{ width: 160 }}
        value={timezone}
        placeholder="-"
        onChange={(e) => onTimezoneChange(e.value)}
        options={TIMEZONES}
        optionLabel="label"
      />
    </WhereEditor>
  );
});
