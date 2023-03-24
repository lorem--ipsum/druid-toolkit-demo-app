import { typedVisualModule } from "@druid-toolkit/visuals-core";
import { C, L, SqlExpression } from "@druid-toolkit/query";
import * as echarts from "echarts";

export const TimeChartB = typedVisualModule({
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

        const vs = (
          await host.sqlQuery(
            `SELECT "org_name" FROM ${table}
            WHERE ${where}
            GROUP BY 1
            ORDER BY COUNT(*) DESC LIMIT 10`
          )
        )
          .toObjectArray()
          .map((v) => v.org_name);

        const data = (
          await host.sqlQuery(
            `SELECT TIME_FLOOR("__time", '${timeGranularity}') AS "time"
            , "org_name" AS "Organization"
            , COUNT(*) AS "Count" FROM ${table}
            WHERE ${where} and "org_name" IN (${vs.map(L)})
            GROUP BY 1, 2
            ORDER BY "time" ASC`
          )
        ).toObjectArray();

        const dataPerSeriesName: Record<string, [Date, number][]> = {};
        data.forEach((d) => {
          const key = d.Organization;
          if (dataPerSeriesName[key]) {
            dataPerSeriesName[key].push([d.time, d.Count]);
          } else {
            dataPerSeriesName[key] = [[d.time, d.Count]];
          }
        });

        const series = vs.map((sName) => {
          return {
            name: sName,
            type: "line",
            symbol: "none",
            stack: "Total",
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
        myChart.dispose();
      },
    };
  },
});
