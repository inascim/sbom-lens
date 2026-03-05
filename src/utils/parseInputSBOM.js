import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

export const convertGraphToCycloneDX = (nodes = [], edges = []) => {
  const { mainComponent, components } = nodes.reduce(
    (acc, node) => {
      const { id, label, isPrimary, licenses, ...data } = node.data || {};

      if (isPrimary) {
        acc.mainComponent = { label, ...data };
      } else {
        acc.components.push({ name: label, licenses, ...data });
      }
      return acc;
    },
    { mainComponent: null, components: [] }
  );

  const dependencies = nodes.map((node) => {
    const nodeEdges = edges.filter((edge) => edge.data.source === node.data.id);
    return {
      ref: node.data.id,
      dependsOn: nodeEdges.map((edge) => edge.data.target),
    };
  });

  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    version: 1,
    components,
    dependencies,
    ...(mainComponent ? { metadata: { component: mainComponent } } : {}),
  };
};

export const convertCycloneDXToGraph = (cycloneDXJSON, baseX = 100, baseY = 100) => {
  const hasComponents = cycloneDXJSON?.components;
  const hasDependencies = cycloneDXJSON?.dependencies;
  let nodes = [];
  let edges = [];

  if (hasComponents) {
    nodes = cycloneDXJSON.components.map((component, index) => ({
      id: _.get(component, "bom-ref"),
      label: component.name || component.purl || `Component ${index}`,
      data: {
        ...component,
        id: _.get(component, "bom-ref"),
      },
      classes: "default-node",
    }));

    const mainComponent = cycloneDXJSON?.metadata?.component;
    nodes.unshift({
      id: _.get(mainComponent, "bom-ref"),
      label: mainComponent?.name || mainComponent?.purl || "Head Component",
      data: {
        ...mainComponent,
        id: _.get(mainComponent, "bom-ref"),
      },
      classes: "default-node",
    });
  }

  if (hasDependencies) {
    edges = cycloneDXJSON.dependencies.reduce((acc, dep) => {
      const ref = _.get(dep, "ref");
      const targetNode = nodes.find((c) => _.get(c, "id") === dep.ref);
      if (!targetNode) return acc;

      const newEdges = (dep.dependsOn || []).map((depRef) => ({
        data: {
          id: `${ref}-${depRef}`,
          uuid: uuidv4(),
          source: ref,
          target: depRef,
          label: "depends_on",
        },
        classes: "default-edge",
      }));
      return [...acc, ...newEdges];
    }, []);
  }

  return {
    nodes,
    edges,
    styling: { name: "circle", animate: true, animationDuration: 600 },
  };
};
