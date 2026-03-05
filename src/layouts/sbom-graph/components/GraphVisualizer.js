import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import PropTypes from "prop-types";
import cytoscape from "cytoscape";
import cxtmenu from "cytoscape-cxtmenu";
import edgehandles from "cytoscape-edgehandles";
import { buildMenuCytoscape, edgehandlesDefaults, layoutOpt } from "utils/cytoscapeConfig";

cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);

// Cytoscape stylesheet — MUI info/success palette
const cytoscapeStyles = [
  {
    selector: "node",
    style: {
      "background-color": "#49a3f1",
      label: "data(name)",
      "font-size": "10px",
      color: "#344767",
      "text-valign": "bottom",
      "text-margin-y": 4,
      "overlay-shape": "ellipse",
      "overlay-padding": "2px",
      width: 28,
      height: 28,
    },
  },
  {
    selector: "node[?isPrimary]",
    style: {
      "background-color": "#4CAF50",
      "border-width": 2,
      "border-color": "#2e7d32",
    },
  },
  {
    selector: "node:selected",
    style: {
      "border-width": 2,
      "border-color": "#1A73E8",
    },
  },
  {
    selector: "edge",
    style: {
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      label: "data(label)",
      "font-size": "8px",
      "line-color": "#9fc9f3",
      "target-arrow-color": "#9fc9f3",
      color: "#7b809a",
      width: 1.5,
      "text-rotation": "autorotate",
      "text-margin-y": -8,
    },
  },
  {
    selector: "edge:selected",
    style: {
      "line-color": "#1A73E8",
      "target-arrow-color": "#1A73E8",
    },
  },
  // Edge handle styles
  {
    selector: ".eh-handle",
    style: {
      "background-color": "#1A73E8",
      width: 12,
      height: 12,
      shape: "ellipse",
      "overlay-opacity": 0,
      "border-width": 12,
      "border-opacity": 0,
    },
  },
  {
    selector: ".eh-hover",
    style: { "background-color": "#1A73E8" },
  },
  {
    selector: ".eh-source",
    style: { "border-width": 2, "border-color": "#1A73E8" },
  },
  {
    selector: ".eh-target",
    style: { "border-width": 2, "border-color": "#1A73E8" },
  },
  {
    selector: ".eh-preview, .eh-ghost-edge",
    style: {
      "background-color": "#1A73E8",
      "line-color": "#1A73E8",
      "target-arrow-color": "#1A73E8",
      "source-arrow-color": "#1A73E8",
    },
  },
];

const GraphVisualizer = forwardRef(({ newGraphData = {}, handleOpenNodeDetails }, ref) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  const clearGraphWithAnimation = () => {
    if (!cyRef.current) return;
    const allNodes = cyRef.current.nodes();
    const allEdges = cyRef.current.edges();
    allNodes.animate({ style: { opacity: 0 }, duration: 500, easing: "ease-in-out" });
    allEdges.animate({ style: { opacity: 0 }, duration: 500, easing: "ease-in-out" });
    setTimeout(() => {
      cyRef.current.remove(allNodes);
      cyRef.current.remove(allEdges);
    }, 500);
  };

  const getAllNodes = () => {
    if (!cyRef.current) return [];
    return cyRef.current.nodes().map((node) => ({
      id: node.id(),
      position: node.position(),
      data: node.data(),
    }));
  };

  const getAllEdges = () => {
    if (!cyRef.current) return [];
    return cyRef.current.edges().map((edge) => ({
      id: edge.id(),
      data: edge.data(),
    }));
  };

  const removeNodeByIdWithAnimation = (nodeID) => {
    if (!cyRef.current) return;
    const node = cyRef.current.getElementById(nodeID);
    if (node?.length) {
      node.animate({ style: { opacity: 0 }, duration: 500, easing: "ease-in-out" });
      setTimeout(() => cyRef.current.remove(node), 500);
    }
  };

  const removeEdgeByIdWithAnimation = (edgeID) => {
    if (!cyRef.current) return;
    const edge = cyRef.current.getElementById(edgeID);
    if (edge?.length) {
      edge.animate({ style: { opacity: 0 }, duration: 500, easing: "ease-in-out" });
      setTimeout(() => cyRef.current.remove(edge), 500);
    }
  };

  const updateNode = (nodeID, newData, newColor) => {
    if (!cyRef.current) return;
    const node = cyRef.current.getElementById(nodeID);
    if (node?.length) {
      node.data(newData);
      if (newColor) node.style({ "background-color": newColor });
    }
  };

  const swapPrimaryComponent = (nodeID) => {
    if (!cyRef.current) return;
    // Reset all currently primary nodes back to default colour
    cyRef.current
      .nodes()
      .filter((n) => n.data("isPrimary"))
      .forEach((n) => {
        const { isPrimary, ...rest } = n.data();
        n.data({ ...rest, isPrimary: false });
        n.style({ "background-color": "#49a3f1" });
      });
    // Mark the new primary node
    const node = cyRef.current.getElementById(nodeID);
    if (node?.length) {
      const { isPrimary, ...rest } = node.data();
      node.data({ ...rest, isPrimary: true });
      node.style({ "background-color": "#4CAF50" });
    }
  };

  const applyLayout = (layoutName) => {
    if (!cyRef.current) return;
    cyRef.current
      .layout({ ...layoutOpt, name: layoutName, animate: true, animationDuration: 600 })
      .run();
  };

  const zoomIn = () => {
    if (!cyRef.current) return;
    cyRef.current.zoom(cyRef.current.zoom() * 1.2);
  };

  const zoomOut = () => {
    if (!cyRef.current) return;
    cyRef.current.zoom(cyRef.current.zoom() / 1.2);
  };

  const fitToView = () => {
    if (!cyRef.current) return;
    cyRef.current.fit(undefined, 50);
  };

  const getStats = () => {
    if (!cyRef.current) return { nodes: 0, edges: 0, depth: 0 };
    const nodes = cyRef.current.nodes().length;
    const edges = cyRef.current.edges().length;
    // Calculate depth by finding the longest path in the graph
    const allNodes = cyRef.current.nodes();
    let maxDepth = 0;
    allNodes.forEach((node) => {
      const ancestors = node.ancestors().nodes().length;
      if (ancestors > maxDepth) maxDepth = ancestors;
    });
    return { nodes, edges, depth: maxDepth + 1 };
  };

  const getZoom = () => {
    if (!cyRef.current) return 100;
    return Math.round(cyRef.current.zoom() * 100);
  };

  useImperativeHandle(ref, () => ({
    applyLayout,
    clearGraphWithAnimation,
    updateNode,
    getAllNodes,
    getAllEdges,
    zoomIn,
    zoomOut,
    fitToView,
    getStats,
    getZoom,
  }));

  // — Init Cytoscape once —
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: cytoscapeStyles,
      layout: layoutOpt,
      wheelSensitivity: 0.25,
    });

    const eh = cyRef.current.edgehandles(edgehandlesDefaults);

    cyRef.current.cxtmenu(
      buildMenuCytoscape({
        handleDetachEdge: removeEdgeByIdWithAnimation,
        handleDismissNode: removeNodeByIdWithAnimation,
        handleRebuildEdge: (edge) => {
          removeEdgeByIdWithAnimation(edge.id());
          eh.start(edge.source());
        },
        handleStartConnection: (node) => eh.start(node),
        handleSetPrimaryComponent: (nodeData) => swapPrimaryComponent(nodeData.id),
      })
    );

    cyRef.current.on("taphold", "node", (e) => {
      if (handleOpenNodeDetails) handleOpenNodeDetails(e.target.data());
    });

    cyRef.current.on("ehcomplete", () => {});

    // Scale cxtmenu font with zoom level
    cyRef.current.on("zoom", () => {
      const zoom = cyRef.current.zoom();
      const fontSize = Math.min(20, Math.max(10, 16 * (zoom / 2)));
      let styleEl = document.getElementById("dynamic-cxtmenu-style");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "dynamic-cxtmenu-style";
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `.cxtmenu-content { font-size: ${fontSize}px !important; }`;
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") eh.stop();
    });
  }, []);

  // — Sync new graph data —
  useEffect(() => {
    if (!cyRef.current) return;
    const nodes = newGraphData.nodes || [];
    const edges = newGraphData.edges || [];
    const layoutStyling = newGraphData.styling || null;

    nodes.forEach((node) => {
      const id = node.data.id;
      const existing = cyRef.current.getElementById(id);
      if (existing?.length) {
        existing.data(node.data);
      } else {
        cyRef.current.add({ ...node, style: { opacity: 0 } });
        cyRef.current.getElementById(id).animate({
          position: node.position,
          style: { opacity: 1 },
          duration: 500,
          easing: "ease-in-out",
        });
      }
    });

    edges.forEach((edge) => {
      const id = edge.data.id;
      const existing = cyRef.current.getElementById(id);
      if (existing?.length) {
        existing.data(edge.data);
      } else {
        cyRef.current.add({ ...edge, style: { opacity: 0 } });
        cyRef.current
          .getElementById(id)
          .animate({ style: { opacity: 1 }, duration: 500, easing: "ease-in-out" });
      }
    });

    if (layoutStyling) {
      cyRef.current
        .$(nodes.map((n) => `#${n?.data?.id}`).join(","))
        .layout({
          name: layoutStyling.name,
          animate: layoutStyling.animate,
          animationDuration: layoutStyling.animationDuration,
        })
        .run();
    }
  }, [newGraphData]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
      }}
    />
  );
});

GraphVisualizer.displayName = "GraphVisualizer";

GraphVisualizer.propTypes = {
  newGraphData: PropTypes.shape({
    nodes: PropTypes.array,
    edges: PropTypes.array,
    styling: PropTypes.object,
  }),
  handleOpenNodeDetails: PropTypes.func,
};

GraphVisualizer.defaultProps = {
  newGraphData: {},
  handleOpenNodeDetails: null,
};

export default GraphVisualizer;
