import React from "react";
import ClickSparkContainer from "./componentes_animados_dashboard/ClickSparkContainer";
import OfflineWrapper from "./OfflineWrapper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClickSparkContainer>
      <OfflineWrapper>
        {children}
      </OfflineWrapper>
    </ClickSparkContainer>
  );
}