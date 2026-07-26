import type { Metadata } from "next";
import TripApp from "./TripApp";

export const metadata: Metadata = {
  title: "Austria 2026 | Family Trip",
  description: "A practical family trip planner for Austria, 16-30 August 2026.",
};

export default function Home() {
  return <TripApp />;
}
