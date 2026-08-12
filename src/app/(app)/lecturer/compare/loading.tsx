import { PageSkeleton } from "@/components/states";

export default function Loading() {
  return <PageSkeleton stats={0} blocks={2} label="Comparing documents" />;
}
