export interface ExamCredentials {
  username: string;
  password: string;
  other: string;
}
export const NO_CREDS: ExamCredentials = { username: "", password: "", other: "" };
export const hasCreds = (c: ExamCredentials) => Boolean(c.username || c.password || c.other);

export function parseCredentials(json: string): ExamCredentials {
  try {
    const v = JSON.parse(json) as Partial<ExamCredentials>;
    return { username: v.username ?? "", password: v.password ?? "", other: v.other ?? "" };
  } catch {
    return { ...NO_CREDS, other: json };
  }
}

