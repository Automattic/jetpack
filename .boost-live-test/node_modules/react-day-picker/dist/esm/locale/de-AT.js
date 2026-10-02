import { deAT as dateFnsDeAT } from "date-fns/locale/de-AT";
import { DateLib } from "../classes/DateLib.js";
/** German (Austria) locale extended with DayPicker-specific translations. */
export const deAT = {
    ...dateFnsDeAT,
    labels: {
        labelDayButton: (date, modifiers, options, dateLib) => {
            const lib = dateLib ?? new DateLib(options);
            let label = lib.format(date, "PPPP");
            if (modifiers.today)
                label = `Heute, ${label}`;
            if (modifiers.selected)
                label = `${label}, ausgewählt`;
            return label;
        },
        labelMonthDropdown: "Monat auswählen",
        labelNext: "Zum nächsten Monat",
        labelPrevious: "Zum vorherigen Monat",
        labelWeekNumber: (weekNumber) => `Woche ${weekNumber}`,
        labelYearDropdown: "Jahr auswählen",
        labelGrid: (date, options, dateLib) => (dateLib ?? new DateLib(options)).formatMonthYear(date),
        labelGridcell: (date, modifiers, options, dateLib) => {
            const lib = dateLib ?? new DateLib(options);
            let label = lib.format(date, "PPPP");
            if (modifiers?.today) {
                label = `Heute, ${label}`;
            }
            return label;
        },
        labelNav: "Navigationsleiste",
        labelWeekNumberHeader: "Wochennummer",
        labelWeekday: (date, options, dateLib) => (dateLib ?? new DateLib(options)).format(date, "cccc"),
    },
};
