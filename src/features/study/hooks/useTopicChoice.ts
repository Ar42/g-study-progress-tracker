import { useMemo } from "react";
import { ProgressStatus } from "../../../enums/progress";
import { findNode } from "../../../lib/tree";
import type { StudyDomain, StudyRow } from "../../../types";
import { useSubjects, useTopics } from "./useStudyData";

/** What the user is studying: BCS subject → chapter, or an IT topic. */
export interface TopicChoice {
  readonly category: StudyDomain;
  readonly subjectId: string;
  readonly topicId: string;
}

export const EMPTY_CHOICE: TopicChoice = { category: "BCS", subjectId: "", topicId: "" };

export interface TopicTarget {
  readonly row: StudyRow | null;
  readonly subjectName: string;
  readonly topicName: string;
  /** A leaf chapter/topic that hasn't been started — can be marked in progress. */
  readonly canMark: boolean;
}

/** Resolves a choice to its current sheet row and display names. */
export function useTopicTarget(choice: TopicChoice): TopicTarget {
  const { subjects } = useSubjects();
  const { topics } = useTopics();
  return useMemo(() => {
    if (choice.category === "IT") {
      const t = topics.find((x) => x.row.id === choice.topicId);
      return {
        row: t?.row ?? null,
        subjectName: "",
        topicName: t?.row.name ?? "",
        canMark: t?.row.status === ProgressStatus.NOT_STARTED,
      };
    }
    const subject = subjects.find((s) => s.row.id === choice.subjectId);
    const node = subject ? findNode(subject.children, choice.topicId) : null;
    return {
      row: node?.row ?? null,
      subjectName: subject?.row.name ?? "",
      topicName: node?.row.name ?? "",
      canMark: Boolean(node?.isLeaf && node.row.status === ProgressStatus.NOT_STARTED),
    };
  }, [choice, subjects, topics]);
}

export interface TopicErrors {
  subject?: string;
  topic?: string;
}

export function validateTopicChoice(c: TopicChoice): TopicErrors {
  const e: TopicErrors = {};
  if (c.category === "BCS" && !c.subjectId) e.subject = "Choose a subject";
  if (!c.topicId) e.topic = c.category === "BCS" ? "Choose a chapter" : "Choose a topic";
  return e;
}
