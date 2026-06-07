import { ProgressStatus } from "../enums/progress";

export interface LeafNode {
  readonly id: string;
  readonly name: string;
  readonly status: ProgressStatus;
}

export interface ParentNode {
  readonly id: string;
  readonly name: string;
  readonly children: readonly StudyNode[];
}

export type StudyNode = LeafNode | ParentNode;

export interface Subject {
  readonly id: string;
  readonly name: string;
  readonly children: readonly StudyNode[];
}
