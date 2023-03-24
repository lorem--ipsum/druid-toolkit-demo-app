import { typedVisualModule } from "@druid-toolkit/visuals-core";
import { C, L } from "@druid-toolkit/query";
import * as echarts from "echarts";

export const BarChart = typedVisualModule({
  parameters: {},
  module: ({ container, host, updateWhere, getLastUpdateEvent }) => {
    const myChart = echarts.init(container);

    myChart.setOption({
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
        },
      ],
      yAxis: [
        {
          type: "value",
        },
      ],
      series: [],
    });

    const resizeHandler = () => {
      myChart.resize();
    };

    window.addEventListener("resize", resizeHandler);

    myChart.on("click", "series.pie", (params) => {
      if (!params.seriesName) return;

      const where = getLastUpdateEvent()?.where;
      if (!where) return;

      updateWhere(
        where.toggleClauseInWhere(C("country").equal(L(params.seriesName)))
      );
    });

    return {
      async update({ table, where }) {
        const vs = (
          await host.sqlQuery(
            `SELECT "channel" FROM ${table}
            WHERE ${where}
            GROUP BY 1
            ORDER BY COUNT(*) DESC LIMIT 5`
          )
        )
          .toObjectArray()
          .map((v) => v.channel);

        const data = (
          await host.sqlQuery(
            `SELECT "countryName" AS "Country"
            , "channel" AS "Channel"
            , COUNT(*) AS "Count" FROM ${table}
            WHERE ${where} and "channel" IN (${vs.map(L)})
            GROUP BY 1, 2
            ORDER BY COUNT(*) DESC `
          )
        ).toObjectArray();

        const xAxisData = new Set();
        const dataPerSeriesName: Record<string, number[]> = {};
        data.forEach((d) => {
          xAxisData.add(d.Country);

          const key = d.Channel;
          if (dataPerSeriesName[key]) {
            dataPerSeriesName[key].push(d.Count);
          } else {
            dataPerSeriesName[key] = [d.Count];
          }
        });

        const series = vs.map((sName) => {
          return {
            name: sName,
            type: "bar",
            stack: "Channel",
            data: dataPerSeriesName[sName],
          };
        });

        myChart.setOption(
          {
            animation: false,
            series,
            xAxis: {
              data: Array.from(xAxisData),
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
          },
          {
            replaceMerge: ["series", "tooltip"],
          }
        );
      },

      destroy() {
        window.removeEventListener("resize", resizeHandler);
        myChart.dispose();
      },
    };
  },
});
