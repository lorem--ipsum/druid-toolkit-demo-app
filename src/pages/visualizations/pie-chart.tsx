import { ExpressionMeta, typedVisualModule } from "@druid-toolkit/visuals-core";
import { C, L, SqlFunction } from "@druid-toolkit/query";
import * as echarts from "echarts";

export const PieChart = typedVisualModule({
  parameters: {
    selectClause: {
      type: "string",
    },
  },
  module: ({ container, host, updateWhere, getLastUpdateEvent }) => {
    const myChart = echarts.init(container);

    const resizeHandler = () => {
      myChart.resize();
    };

    window.addEventListener("resize", resizeHandler);

    myChart.on("click", "series.pie", (params) => {
      const where = getLastUpdateEvent()?.where;
      if (!where) return;

      updateWhere(
        where.toggleClauseInWhere(C("country").equal(L(params.name)))
      );
    });

    return {
      async update({ table, where, parameterValues }) {
        const { selectClause } = parameterValues;

        const data = (
          await host.sqlQuery(
            `${selectClause}
            FROM ${table}
            WHERE ${where}
            GROUP BY 1
            ORDER BY COUNT(*) DESC LIMIT 5`
          )
        ).toObjectArray();

        myChart.setOption({
          animation: false,
          tooltip: {
            trigger: "item",
            transitionDuration: 0,
          },
          series: [
            {
              type: "pie",
              radius: "50%",
              data,
            },
          ],
        });
      },
      destroy() {
        window.removeEventListener("resize", resizeHandler);
        myChart.off("click");
        myChart.dispose();
      },
    };
  },
});
