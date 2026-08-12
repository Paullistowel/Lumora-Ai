import { redirect } from "next/navigation";

/**
 * Peer review used to live here, split across two pages depending on who
 * allocated the review. It is one job for the student, so it is now one hub.
 */
export default function ReviewsRedirect() {
  redirect("/student/peer-review");
}
