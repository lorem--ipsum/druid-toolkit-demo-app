import { ExpressionMeta, typedVisualModule } from "@druid-toolkit/visuals-core";
import { C, L, SqlFunction } from "@druid-toolkit/query";
import * as echarts from "echarts";

export const PieChart = typedVisualModule({
  parameters: {},
  module: ({ container, host, updateWhere, getLastUpdateEvent }) => {
    const myChart = echarts.init(container);

    return {
      async update({ table, where }) {
        const data = (
          await host.sqlQuery(
            `SELECT "org_name\" as "name", COUNT(*) AS "value"
            FROM ${table}
            WHERE ${where}
            GROUP BY 1
            ORDER BY COUNT(*) DESC LIMIT 10`
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
      resize() {
        myChart.resize();
      },
      destroy() {
        myChart.dispose();
      },
    };
  },
});
