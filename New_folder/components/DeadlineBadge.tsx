"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";

export default function DeadlineBadge({ deadline }: { deadline: string }) {
  const [label, setLabel] = useState("");
  const [cls, setCls] = useState("badge");

  useEffect(() => {
    const daysLeft = differenceInCalendarDays(new Date(deadline), new Date());
    const newLabel = daysLeft < 0 ? `Closed (${format(new Date(deadline), 'd MMM')})` : daysLeft === 0 ? "Deadline today" : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
    const newCls = daysLeft < 0 ? "badge-danger" : daysLeft <= 3 ? "badge-warning" : "badge-success";
    
    setLabel(newLabel);
    setCls(`badge ${newCls}`);
  }, [deadline]);

  return <span className={cls}>{label}</span>;
}
