import { PageSkeleton } from "@/components/states";

export default function Loading() {
  return <PageSkeleton stats={4} blocks={2} label="Loading class analytics" />;
}
