import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchResults } from "@/components/search-results";

export const metadata: Metadata = {
  title: "Search",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <p className="label" aria-busy="true">
          Searching…
        </p>
      }
    >
      <SearchResults />
    </Suspense>
  );
}