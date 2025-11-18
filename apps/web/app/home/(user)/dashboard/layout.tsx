import React from "react";
import OfflineWrapper from "./OfflineWrapper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OfflineWrapper>
      {children}
    </OfflineWrapper>
  );
}