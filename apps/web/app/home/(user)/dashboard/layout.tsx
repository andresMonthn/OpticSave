"use client";
import React from "react";
import ClickSparkContainer from "./componentes_animados_dashboard/ClickSparkContainer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClickSparkContainer sparkColor="#555" sparkSize={10} sparkRadius={15} sparkCount={10} duration={200} easing="ease-out" extraScale={1}>
      {children}
    </ClickSparkContainer>
  );
}