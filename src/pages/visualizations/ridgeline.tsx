import { typedVisualModule } from "@druid-toolkit/visuals-core";
import * as d3 from "d3";
import { L } from "@druid-toolkit/query";

export const Ridgeline = typedVisualModule({
  parameters: {},
  module: ({ container, host }) => {
    const svg = d3.select(container).append("svg");
    const g = svg.append("g");

    return {
      async update({ table, where }) {
        const series = (
          await host.sqlQuery(
            `SELECT event_subtype, count(*) FROM ${table} WHERE ${where} group by 1 order by 2 DESC LIMIT 20`
          )
        )
          .toObjectArray()
          .map((row) => row.event_subtype)
          .reverse();

        const resultPerSeries = await Promise.all(
          series.map((s) => {
            return host.sqlQuery(
              `SELECT TIME_FLOOR("__time", 'PT5M') AS "time", sum(CASE WHEN "event_subtype"=${L(
                s
              )} then 1 else 0 end) AS "count" from ${table} WHERE ${where}
              
              GROUP BY 1 ORDER BY 1 ASC LIMIT 200`
            );
          })
        );

        var myColor = d3
          .scaleSequential()
          .domain([0, series.length])
          .interpolator(d3.interpolateViridis);

        const data = resultPerSeries.map((r) => r.toObjectArray());
        const max = d3.max(data.map((d) => d3.max(d.map((_d) => _d.count))));

        const rect = container.getBoundingClientRect();

        // set the dimensions and margins of the graph
        const margin = { top: 0, right: 0, bottom: 0, left: 0 },
          width = rect.width - margin.left - margin.right,
          height = rect.height - margin.top - margin.bottom;

        // append the svg object to the body of the page
        svg
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom);

        // g.attr("transform", `translate(${margin.left}, ${margin.top})`);

        //read data
        // Get the different categories and count them
        const n = series.length;

        // Add X axis
        const x = d3
          .scaleTime()
          .domain([data[0][0].time, data[0][data[0].length - 1].time])
          .range([0, width]);
        // g.append("g")
        //   .attr("transform", `translate(0, ${height})`)
        //   .call(d3.axisBottom(x));

        // Create a Y scale for densities
        const y = d3
          .scaleLinear()
          .domain([0, max / 3])
          .range([height / n, 0]);

        // Create the Y axis for names
        const yName = d3.scaleBand().domain(series).range([0, height]).align(0);
        // g.append("g").call(d3.axisLeft(yName));

        const allData: {
          key: string;
          data: { time: Date; count: number; seriesIndex: number }[];
        }[] = [];
        for (let i = 0; i < n; i++) {
          allData.push({
            key: series[i],
            data: data[i].map((d) => ({ ...d, seriesIndex: i })) as any,
          });
        }

        // Add areas
        g.selectAll("areas")
          .data(allData)
          .join("path")
          .attr("transform", (d) => `translate(0, ${yName(d.key) || 0})`)
          .datum((d) => d.data)
          // .attr("fill", (_d, i) => myColor(i))
          .attr("fill", "transparent")
          .attr("opacity", 0.6)
          .attr("stroke", (_d, i) => myColor(i))
          .attr("stroke-width", 2)
          .attr(
            "d",
            d3
              .line<{ time: Date; count: number; seriesIndex: number }>()
              .curve(d3.curveBasis)
              .x((d) => x(d.time))
              .y((d) => y(d.count))
            // .y1((d) => y(d.count))
            // .y0((d) => y(0))
          );
      },
      destroy() {},
    };
  },
});
