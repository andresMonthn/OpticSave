import React from "react";
import ClickSparkContainer from "./componentes_animados_dashboard/ClickSparkContainer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClickSparkContainer>
      {children}
    </ClickSparkContainer>
  );
}