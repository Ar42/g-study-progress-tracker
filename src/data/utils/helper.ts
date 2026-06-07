import { ProgressStatus } from "../../enums/progress";
import type { Subject } from "../../types";

// Helper to recursively parse raw JSON nodes into strongly typed models
export function castToSubject(data: any): Subject {
  const mapNode = (node: any): any => {
    if ("children" in node && Array.isArray(node.children)) {
      return {
        id: String(node.id),
        name: String(node.name),
        children: node.children.map(mapNode),
      };
    }
    return {
      id: String(node.id),
      name: String(node.name),
      status: (node.status as ProgressStatus) || ProgressStatus.NOT_STARTED,
    };
  };

  return {
    id: String(data.id),
    name: String(data.name),
    children: (data.children || []).map(mapNode),
  };
}
