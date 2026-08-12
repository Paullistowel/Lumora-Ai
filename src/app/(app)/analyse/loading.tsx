import { PageSkeleton } from "@/components/states";

export default function Loading() {
  return <PageSkeleton stats={0} blocks={3} label="Opening the analysis workspace" />;
}
