import { Host, ExpressionMeta } from "@druid-toolkit/visuals-core";
import { useModuleContainer } from "@druid-toolkit/visuals-react";
import { memo } from "react";

import styles from "@/styles/module-container.module.css";

export const ModuleContainer = memo(function ModuleContainer(props: {
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
