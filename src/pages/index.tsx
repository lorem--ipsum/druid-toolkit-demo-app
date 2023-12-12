import Head from "next/head";
import styles from "@/styles/Home.module.css";
import "@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css";
import "react-calendar/dist/Calendar.css";
import {
  ExpressionMeta,
  VisualModuleDefinition,
} from "@druid-toolkit/visuals-core";
import { useHost } from "@druid-toolkit/visuals-react";
import { SqlExpression, T } from "@druid-toolkit/query";

import { PieChart } from "./visualizations/pie-chart";
import { BarChart } from "./visualizations/bar-chart";
import { TimeChart } from "./visualizations/time-chart";
import { useEffect, useMemo, useState } from "react";
import { TimeChartA } from "./visualizations/time-chart-a";
import { TimeChartB } from "./visualizations/time-chart-b";
import { Raw } from "./visualizations/raw";
import { ModuleContainer, WhereTimeClauseEditor } from "./components";

const VISUAL_MODULES: Record<string, VisualModuleDefinition<any>> = {
  pie_chart: PieChart,
  bar_chart: BarChart,
  time_chart: TimeChart,
  time_chart_a: TimeChartA,
  time_chart_b: TimeChartB,
  raw: Raw,
};

const TIME_COLUMN = "__time";

const DEFAULT_WHERE = SqlExpression.parse(
  `TIME_SHIFT(CURRENT_TIMESTAMP, 'P1W', -1) <= ${TIME_COLUMN} AND ${TIME_COLUMN} < CURRENT_TIMESTAMP`
);

async function queryDruidSql<T = any>(
  sqlQueryPayload: Record<string, any>
): Promise<T[]> {
  const response = await fetch("api/sql", {
    method: "POST",
    body: JSON.stringify(sqlQueryPayload),
  });

  const j = await response.json();

  if (j.error) {
    throw new Error(j.error.message);
  }

  return j;
}

export default function Home() {
  const selectedModules = useMemo(
    () => [
      { type: "time_chart_a", id: "a" },
      { type: "time_chart_b", id: "b" },
      { type: "raw", id: "c" },
    ],
    []
  );

  const [columns] = useState<Record<string, ExpressionMeta[]>>(() => {
    return {
      a: [],
      b: [],
      c: [],
    };
  });

  const [loadIndex, setLoadIndex] = useState(0);

  const [where, setWhere] = useState<SqlExpression>(DEFAULT_WHERE);

  const { host, setModulesWhere } = useHost({
    sqlQuery: queryDruidSql,
    visualModules: VISUAL_MODULES,
    selectedModules,
    moduleStates: {
      a: {
        parameterValues: {},
        table: T("HTTP Response Codes - Polaris"),
        where,
      },
      b: {
        parameterValues: {},
        table: T("HTTP Response Codes - Polaris"),
        where,
      },
      c: {
        parameterValues: {},
        table: T("HTTP Response Codes - Polaris"),
        where,
      },
    },
    interceptors: {
      setModuleWhere: (moduleId, whereClause) => {
        setWhere(whereClause);
        return undefined;
      },
    },
  });

  useEffect(() => {
    host.store.setState((s) => ({
      context: { ...s.context, loadIndex },
    }));
  }, [loadIndex, host.store]);

  useEffect(() => {
    const newWheres = selectedModules.map((m) => {
      return { moduleId: m, where };
    });

    setModulesWhere(newWheres);
  }, [where, selectedModules, host, setModulesWhere]);

  return (
    <>
      <Head>
        <title>My awesome dashboard</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.whereClause}>
          <WhereTimeClauseEditor
            where={where}
            onChange={setWhere}
            timeColumn={TIME_COLUMN}
          />
        </div>
        <div className={styles.visualizations}>
          {selectedModules.map((s) => (
            <ModuleContainer
              key={s.id}
              selectedModule={s}
              host={host}
              columns={columns[s.id]}
            />
          ))}
        </div>
      </main>
    </>
  );
}
