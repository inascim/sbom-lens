import _ from "lodash";

export const hashCode = (s) =>
  String(
    s.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0)
  );

export const bfsTraverse = ({ nodes, edges }, nodeID) => {
  const startNode = _.get(nodes, `${nodeID}`);
  if (!startNode) return;

  const queue = [startNode];
  const visitedNodes = new Set([startNode?.data?.id]);
  const visitedEdges = new Set();

  while (queue.length) {
    const currentNode = queue.shift();
    const relatedEdges = Object.values(edges).filter(
      (edge) => _.get(edge, "data.source", "") === currentNode?.data?.id
    );

    for (const edge of relatedEdges) {
      if (!visitedEdges.has(edge?.data?.id)) {
        visitedEdges.add(edge?.data?.id);
        const relatedNode = _.get(nodes, _.get(edge, "data.target", ""), {});
        if (relatedNode && !visitedNodes.has(relatedNode?.data?.id)) {
          queue.push(relatedNode);
          visitedNodes.add(relatedNode?.data?.id);
        }
      }
    }
  }

  return { visitedEdges, visitedNodes };
};
