import { PageSkeleton } from "@/components/states";

export default function Loading() {
  return <PageSkeleton stats={4} blocks={1} label="Loading your writing progress" />;
}
