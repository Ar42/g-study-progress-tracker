import englishData from "./english.json";
import scienceData from "./science.json";
import bangladeshAffairsData from "./bangladesh-affairs.json";

import type { Subject } from "../types";
import { castToSubject } from "./utils/helper";

export const englishSubject = castToSubject(englishData);
export const scienceSubject = castToSubject(scienceData);
export const bangladeshAffairsSubject = castToSubject(bangladeshAffairsData);

export const SUBJECTS: readonly Subject[] = [
  // englishSubject,
  // scienceSubject,
  bangladeshAffairsSubject,
];
