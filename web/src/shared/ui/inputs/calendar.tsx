"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import "react-day-picker/style.css";

import { cn } from "@/shared/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            locale={es}
            showOutsideDays={showOutsideDays}
            className={cn("rdp-custom p-3", className)}
            style={
                {
                    "--rdp-accent-color": "#f97316",
                    "--rdp-accent-background-color": "#fff7ed",
                } as React.CSSProperties
            }
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
