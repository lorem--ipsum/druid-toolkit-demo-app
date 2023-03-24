import Head from "next/head";
import styles from "@/styles/Home.module.css";
import {
  ExpressionMeta,
  Host,
  ModuleId,
  VisualModuleDefinition,
} from "@druid-toolkit/visuals-core";
import { useHost, useModuleContainer } from "@druid-toolkit/visuals-react";
import {
  C,
  L,
  SqlExpression,
  SqlLiteral,
  SqlWhereClause,
  T,
} from "@druid-toolkit/query";

import { PieChart } from "./visualizations/pie-chart";
import { BarChart } from "./visualizations/bar-chart";
import { TimeChart } from "./visualizations/time-chart";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TimeChartA } from "./visualizations/time-chart-a";
import { TimeChartB } from "./visualizations/time-chart-b";

const VISUAL_MODULES: Record<string, VisualModuleDefinition<any>> = {
  pie_chart: PieChart,
  bar_chart: BarChart,
  time_chart: TimeChart,
  time_chart_a: TimeChartA,
  time_chart_b: TimeChartB,
};

const DEFAULT_WHERE = SqlExpression.parse(
  `TIME_SHIFT(CURRENT_TIMESTAMP, 'P1M', -1) <= __time AND __time < CURRENT_TIMESTAMP`
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
    // TODO we need a better way of handling errors in @druid-toolkit/visuals-core
    // so errors are passed to visual modules
    return [];
  }

  return j;
}

export default function Home() {
  const selectedModules = useMemo(
    () => [
      { type: "time_chart_a", id: "a" },
      { type: "time_chart_b", id: "b" },
    ],
    []
  );

  const [columns] = useState<Record<string, ExpressionMeta[]>>(() => {
    return {
      a: [],
      b: [],
    };
  });

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
    },
    interceptors: {
      setModuleWhere: (moduleId, whereClause) => {
        setWhere(whereClause);
        return undefined;
      },
    },
  });

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
          {where.toString() !== "TRUE" ? (
            where.toString()
          ) : (
            <i style={{ color: "lightgrey" }}>#nofilter</i>
          )}
          {where.toString() !== DEFAULT_WHERE.toString() && (
            <button
              style={{ marginLeft: 20 }}
              onClick={() => setWhere(DEFAULT_WHERE)}
            >
              Clear
            </button>
          )}
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

function ModuleContainer(props: {
  selectedModule: { id: string; type: string };
  host: Host;
  columns: ExpressionMeta[];
}) {
  const { selectedModule, host, columns } = props;

  const [ref] = useModuleContainer({
    selectedModule,
    host,
    columns,
  });

  return <div className={styles.moduleContainer} ref={ref} />;
}
