// Edgehandles behavioral config — no visual styles (those live in GraphVisualizer)
export const edgehandlesDefaults = {
  canConnect: (sourceNode, targetNode) => {
    const isNotLoop = !sourceNode.same(targetNode);
    const isNotDuplicate = sourceNode.edgesTo(targetNode).length === 0;
    return isNotLoop && isNotDuplicate;
  },
  edgeParams: () => ({}),
  hoverDelay: 150,
  snap: true,
  snapThreshold: 50,
  snapFrequency: 15,
  noEdgeEventsInDraw: true,
  disableBrowserGestures: true,
};

// Default layout algorithm options
export const layoutOpt = {
  fit: true,
  padding: 150,
  avoidOverlap: true,
  animate: false,
  animationDuration: 500,
  nodeDimensionsIncludeLabels: false,
};

// Context menu builder — colors aligned with MUI neutral palette
const baseMenuConfig = {
  menuRadius: () => 55,
  fillColor: "rgba(33, 33, 33, 0.85)",
  activeFillColor: "rgba(26, 115, 232, 0.90)",
  activePadding: 20,
  indicatorSize: 24,
  separatorWidth: 3,
  spotlightPadding: 4,
  adaptativeNodeSpotlightRadius: true,
  minSpotlightRadius: 24,
  maxSpotlightRadius: 38,
  openMenuEvents: "cxttap taphold",
  closeMenuEvents: "",
  itemColor: "white",
  itemTextShadowColor: "transparent",
  zIndex: 9999,
  atMouse: false,
  outsideMenuCancel: false,
};

const nodeMenuConfig = (handleDismissNode, handleStartConnection, handleSetPrimaryComponent) => [
  {
    content: "🗑️",
    select: (ele) => handleDismissNode(ele?.data()?.id),
    enabled: true,
  },
  {
    content: "🔗",
    select: (ele) => handleStartConnection(ele),
    enabled: true,
  },
  {
    content: "⭐",
    select: (ele) => handleSetPrimaryComponent(ele?.data()),
    enabled: true,
  },
];

const edgeMenuConfig = (handleDetachEdge, handleRebuildEdge) => [
  {
    content: "✂️",
    select: (ele) => handleDetachEdge(ele?.data()?.id),
    enabled: true,
  },
  {
    content: "♻️",
    select: (ele) => handleRebuildEdge(ele),
    enabled: true,
  },
];

export const buildMenuCytoscape = ({
  handleDismissNode,
  handleStartConnection,
  handleSetPrimaryComponent,
  handleDetachEdge,
  handleRebuildEdge,
}) => ({
  ...baseMenuConfig,
  selector: "node, edge",
  commands: (ele) => {
    if (ele.isNode())
      return nodeMenuConfig(handleDismissNode, handleStartConnection, handleSetPrimaryComponent);
    if (ele.isEdge()) return edgeMenuConfig(handleDetachEdge, handleRebuildEdge);
  },
});
