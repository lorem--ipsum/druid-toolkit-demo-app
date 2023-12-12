import { typedVisualModule } from "@druid-toolkit/visuals-core";
import { C, SqlColumn, SqlExpression } from "@druid-toolkit/query";
import * as echarts from "echarts";

export const TimeChartA = typedVisualModule({
  parameters: {
    timeGranularity: {
      type: "string",
      default: "PT1H",
    },
  },
  module: ({ container, host, updateWhere }) => {
    const myChart = echarts.init(container);

    myChart.setOption({
      dataset: {
        dimensions: [],
        source: [],
      },
      tooltip: {
        trigger: "axis",
        transitionDuration: 0,
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#6a7985",
          },
        },
      },
      brush: {
        toolbox: ["lineX"],
        xAxisIndex: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "time",
          boundaryGap: false,
        },
      ],
      yAxis: [
        {
          type: "value",
        },
      ],
      series: [],
    });

    return {
      async update({ table, where, parameterValues }) {
        const { timeGranularity } = parameterValues;

        myChart.off("brushend");

        const codes = (
          await host.sqlQuery(
            `SELECT "code" FROM ${table}
            WHERE ${where}
            GROUP BY 1
            ORDER BY COUNT(*) DESC LIMIT 10`
          )
        )
          .toObjectArray()
          .map((v) => v.code);

        const data = (
          await host.sqlQuery(`
      SELECT t0."__time", ${codes
        .map((c, i) => `t${i}."${c}"`)
        .join(", ")} FROM 
      ${codes
        .map((c, i) => {
          return `
        (
          SELECT TIME_FLOOR("__time", '${timeGranularity}') AS "__time",
          COUNT(*) AS "${c}"
          FROM "HTTP Response Codes - Polaris"
          WHERE "code" IN ('${c}')
          GROUP BY 1
          ORDER BY "__time" ASC
        ) as t${i} ${i === 0 ? "" : `ON t0."__time" = t${i}."__time"`}
        `;
        })
        .join(" LEFT JOIN ")}
        WHERE ${where.walk((q) =>
          q instanceof SqlColumn ? q.changeTableName("t0") : q
        )}
      `)
        ).toObjectArray();

        const dataPerSeriesName: Record<string, [Date, number][]> = {};
        data.forEach((d) => {
          codes.forEach((c) => {
            if (dataPerSeriesName[c]) {
              dataPerSeriesName[c].push([d.__time, d[c]]);
            } else {
              dataPerSeriesName[c] = [[d.__time, d[c]]];
            }
          });
        });

        const series = codes.map((sName) => {
          return {
            name: sName,
            type: "bar",
            symbol: "none",
            stack: "Totals",
            smooth: true,
            data: dataPerSeriesName[sName],
            lineStyle: {
              width: 1,
            },
          };
        });

        myChart.on("brushend", (params: any) => {
          if (!params.areas.length) return;

          const [start, end] = params.areas[0].coordRange;

          updateWhere(
            where.changeClauseInWhere(
              SqlExpression.parse(
                `TIME_IN_INTERVAL(${C("__time")}, '${new Date(
                  start
                ).toISOString()}/${new Date(end).toISOString()}')`
              )
            )
          );

          myChart.dispatchAction({
            type: "brush",
            command: "clear",
            areas: [],
          });
        });

        myChart.setOption(
          {
            xAxis: [
              {
                type: "time",
              },
            ],
            yAxis: [
              {
                type: "value",
              },
            ],
            animation: false,
            series,
          },
          {
            replaceMerge: ["legend", "series"],
          }
        );
      },
      resize() {
        myChart?.resize();
      },
      destroy() {
        myChart?.dispose();
      },
    };
  },
});
