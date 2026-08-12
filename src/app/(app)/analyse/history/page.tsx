import { redirect } from "next/navigation";

/**
 * Analysis history folded into the unified Reports page, so a student has one
 * place to look rather than one per report family.
 */
export default function AnalysisHistoryRedirect() {
  redirect("/reports");
}
