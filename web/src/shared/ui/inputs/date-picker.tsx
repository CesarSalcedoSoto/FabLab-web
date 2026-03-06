"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/shared/utils";
import { Button } from "@/shared/ui/buttons/button";
import { Calendar } from "@/shared/ui/inputs/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/misc/popover";

interface DatePickerProps {
    value?: string;           // ISO date string "YYYY-MM-DD"
    onChange?: (date: string) => void;
    placeholder?: string;
    className?: string;
    id?: string;
    disabled?: (date: Date) => boolean;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Seleccionar fecha",
    className,
    id,
    disabled,
}: DatePickerProps) {
    const selected = React.useMemo(() => {
        if (!value) return undefined;
        try {
            const d = parse(value, "yyyy-MM-dd", new Date());
            return isNaN(d.getTime()) ? undefined : d;
        } catch {
            return undefined;
        }
    }, [value]);

    return (
        <Popover modal>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selected && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selected
                        ? format(selected, "PPP", { locale: es })
                        : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(day) => {
                        if (day) {
                            onChange?.(format(day, "yyyy-MM-dd"));
                        }
                    }}
                    disabled={disabled}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}
