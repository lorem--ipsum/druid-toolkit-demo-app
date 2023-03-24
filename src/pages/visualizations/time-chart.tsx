import { typedVisualModule } from "@druid-toolkit/visuals-core";
import {
  C,
  L,
  SeparatedArray,
  SqlExpression,
  SqlFromClause,
  SqlLiteral,
  SqlOrderByExpression,
  SqlQuery,
} from "@druid-toolkit/query";
import * as echarts from "echarts";

export const TimeChart = typedVisualModule({
  parameters: {
    selectClause: {
      type: "string",
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

    const resizeHandler = () => {
      myChart.resize();
    };

    window.addEventListener("resize", resizeHandler);

    return {
      async update({ table, where, parameterValues }) {
        const { selectClause } = parameterValues;

        if (!selectClause) return;

        myChart.off("brushend");

        const from = SqlFromClause.create(
          SeparatedArray.fromSingleValue(table.as("t"))
        );
        const select = SqlExpression.parse(selectClause);
        const query = SqlQuery.parse(selectClause)
          .changeFromClause(from)
          .applyIf(String(where) !== "TRUE", (q) =>
            q.changeWhereExpression(where)
          )
          .applyForEach(select.getColumns(), (q, col) =>
            q.addGroupBy(SqlLiteral.index(0))
          )
          .addOrderBy(SqlOrderByExpression.create(SqlLiteral.index(0), "ASC"));

        console.log(query.toString());
        const data = (await host.sqlQuery(query)).toObjectArray();

        myChart.on("brushend", (params: any) => {
          if (!params.areas.length) return;

          const [start, end] = params.areas[0].coordRange;

          updateWhere(
            where.changeClauseInWhere(
              SqlExpression.parse(
                `TIME_IN_INTERVAL(${C("__time")}, '${data[
                  start
                ].time.toISOString()}/${data[end].time.toISOString()}')`
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
            dataset: {
              dimensions: ["time", "Count"],
              source: data,
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
            animation: false,
            series: {
              id: "Count",
              name: "Count",
              type: "line",
              stack: "Total",
              areaStyle: {},
              emphasis: {
                focus: "series",
              },
              encode: {
                x: "time",
                y: "Count",
                itemId: "Count",
              },
            },
          },
          {
            replaceMerge: ["legend", "series"],
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
