import { typedVisualModule } from "@druid-toolkit/visuals-core";
import { createRoot, Root } from "react-dom/client";

export const Raw = typedVisualModule({
  parameters: {},
  module: ({ container, host }) => {
    const rootContainer = document.createElement("div");
    container.appendChild(rootContainer);

    let root = createRoot(rootContainer);

    return {
      async update({ table, where }) {
        const result = await host.sqlQuery(
          `SELECT *
            FROM ${table}
            WHERE ${where}
            LIMIT 20`
        );

        const rows = result.toObjectArray();

        root.render(
          <div
            style={{
              height: 400,
              width: "100%",
              overflow: "auto",
              fontSize: "9px",
            }}
          >
            {rows.map((row, i) => (
              <pre key={i}>{JSON.stringify(row, null, 2)}</pre>
            ))}
          </div>
        );
      },
      async destroy() {
        await unmountReactComponentAtNode(root);
      },
    };
  },
});

async function unmountReactComponentAtNode(root: Root) {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      root.unmount();
      resolve();
    });
  });
}
