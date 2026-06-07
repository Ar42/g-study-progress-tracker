import { ProgressStatus } from "../enums/progress";

export interface LinkItem {
  readonly title: string;
  readonly link: string;
  readonly sourceName: string;
}

export interface NodeExtension {
  readonly preliMarks?: string;
  readonly comments?: string;
  readonly startedDate?: string;
  readonly targetToCompleteDate?: string;
  readonly completedDate?: string;
  readonly links?: readonly LinkItem[];
}

export interface LeafNode extends NodeExtension {
  readonly id: string;
  readonly name: string;
  readonly status: ProgressStatus;
}

export interface ParentNode extends NodeExtension {
  readonly id: string;
  readonly name: string;
  readonly children: readonly StudyNode[];
}

export type StudyNode = LeafNode | ParentNode;

export interface Subject extends NodeExtension {
  readonly id: string;
  readonly name: string;
  readonly children: readonly StudyNode[];
}
