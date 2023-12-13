import Head from "next/head";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/mira/theme.css";
import styled from "@emotion/styled";
import {
  ExpressionMeta,
  VisualModuleDefinition,
} from "@druid-toolkit/visuals-core";
import { useHost } from "@druid-toolkit/visuals-react";
import { SqlExpression, T } from "@druid-toolkit/query";
import { useEffect, useMemo, useState } from "react";

import { PieChart } from "./visualizations/pie-chart";
import { BarChart } from "./visualizations/bar-chart";
import { TimeChart } from "./visualizations/time-chart";
import { TimeChartA } from "./visualizations/time-chart-a";
import { TimeChartB } from "./visualizations/time-chart-b";
import { Raw } from "./visualizations/raw";
import { ModuleContainer, WhereTimeClauseEditor } from "./components";

const Main = styled.main`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  padding: 20px;

  font-family: sans-serif;
  background-color: rgb(14 39 68 / 16%);

  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
`;

const WhereClause = styled.div`
  background-color: white;
  box-shadow: 0 1px 3px rgba(14, 39, 68, 0.12);
  padding: 20px;
  border-radius: 3px;
`;

const Visualizations = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  grid-gap: 16px;
  flex: 1;
`;

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
      { type: "pie_chart", id: "d" },
    ],
    []
  );

  const [columns] = useState<Record<string, ExpressionMeta[]>>(() => {
    return {
      a: [],
      b: [],
      c: [],
      d: [],
    };
  });

  const [timezone, setTimezone] = useState("Etc/UTC");

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
      d: {
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
      context: { ...s.context, timezone },
    }));
  }, [timezone, host.store]);

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
      <PrimeReactProvider>
        <Main>
          <WhereClause>
            <WhereTimeClauseEditor
              where={where}
              timezone={timezone}
              onTimezoneChange={setTimezone}
              onChange={setWhere}
              timeColumn={TIME_COLUMN}
            />
          </WhereClause>
          <Visualizations>
            {selectedModules.map((s) => (
              <ModuleContainer
                key={s.id}
                selectedModule={s}
                host={host}
                columns={columns[s.id]}
              />
            ))}
          </Visualizations>
        </Main>
      </PrimeReactProvider>
    </>
  );
}
