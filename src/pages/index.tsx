import Head from "next/head";
import styles from "@/styles/Home.module.css";
import {
  ExpressionMeta,
  Host,
  VisualModuleDefinition,
} from "@druid-toolkit/visuals-core";
import { useHost, useModuleContainer } from "@druid-toolkit/visuals-react";
import { SqlExpression, T } from "@druid-toolkit/query";

import { PieChart } from "./visualizations/pie-chart";
import { BarChart } from "./visualizations/bar-chart";
import { TimeChart } from "./visualizations/time-chart";
import { RefObject, memo, useEffect, useMemo, useRef, useState } from "react";
import { TimeChartA } from "./visualizations/time-chart-a";
import { TimeChartB } from "./visualizations/time-chart-b";
import { Raw } from "./visualizations/raw";

const VISUAL_MODULES: Record<string, VisualModuleDefinition<any>> = {
  pie_chart: PieChart,
  bar_chart: BarChart,
  time_chart: TimeChart,
  time_chart_a: TimeChartA,
  time_chart_b: TimeChartB,
  raw: Raw,
};

const DEFAULT_WHERE = SqlExpression.parse(
  `TIME_SHIFT(CURRENT_TIMESTAMP, 'P1W', -1) <= __time AND __time < CURRENT_TIMESTAMP`
);

async function queryDruidSql<T = any>(
  sqlQueryPayload: Record<string, any>,
  forceError = false
): Promise<T[]> {
  const response = await fetch("api/sql", {
    method: "POST",
    body: JSON.stringify({ ...sqlQueryPayload, forceError }),
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
      // { type: "time_chart_b", id: "b" },
      // { type: "raw", id: "c" },
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

  const [forceServerError, setForceServerError] = useState(false);
  const [loadIndex, setLoadIndex] = useState(0);

  const [where, setWhere] = useState<SqlExpression>(DEFAULT_WHERE);

  const { host, setModulesWhere } = useHost({
    sqlQuery: (q) => queryDruidSql(q, forceServerError),
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
          <label>
            <input
              type="checkbox"
              checked={forceServerError}
              style={{ marginLeft: 20 }}
              onChange={(e) => {
                setForceServerError(e.target.checked);
                setLoadIndex(loadIndex + 1);
              }}
            />
            Error mode
          </label>
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

const ModuleContainer = memo(function ModuleContainer(props: {
  selectedModule: { id: string; type: string };
  host: Host;
  columns: ExpressionMeta[];
}) {
  const { selectedModule, host, columns } = props;

  const [ref, _update, error] = useModuleContainer({
    selectedModule,
    host,
    columns,
  });

  return (
    <div
      className={error ? styles.moduleContainerError : styles.moduleContainer}
    >
      <div className={styles.visualization} ref={ref} />
      {error && <div className={styles.error}>{String(error)}</div>}
    </div>
  );
});
