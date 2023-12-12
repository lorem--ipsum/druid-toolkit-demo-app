import styled from "@emotion/styled";
import { Host, ExpressionMeta } from "@druid-toolkit/visuals-core";
import { useModuleContainer } from "@druid-toolkit/visuals-react";
import { memo } from "react";

const Container = styled.div<{ inError?: boolean }>((props) => ({
  position: "relative",
  backgroundColor: "white",

  boxShadow: "0 1px 3px rgba(14, 39, 68, 0.12)",
  padding: "20px",
  height: "400px",
  borderRadius: "3px",
  fontSize: "12px",
  border: props.inError ? "1px solid #c30b0b" : "1px solid #e5e5e5",
  color: props.inError ? "#c30b0b" : "#333",
}));

const Visualization = styled.div`
  height: 100%;
  width: 100%;
`;

const VizError = styled.div(() => ({
  backgroundColor: "#c30b0bb0",
  color: "white",
  padding: "20px",
  position: "absolute",
  inset: 0,
}));

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
    <Container inError={!!error}>
      <Visualization ref={ref} />
      {error && <VizError>{String(error)}</VizError>}
    </Container>
  );
});
