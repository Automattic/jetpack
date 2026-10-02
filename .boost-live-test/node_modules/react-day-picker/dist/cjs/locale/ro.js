"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ro = void 0;
const ro_1 = require("date-fns/locale/ro");
const DateLib_js_1 = require("../classes/DateLib.js");
/** Romanian locale extended with DayPicker-specific translations. */
exports.ro = {
    ...ro_1.ro,
    labels: {
        labelDayButton: (date, modifiers, options, dateLib) => {
            const lib = dateLib ?? new DateLib_js_1.DateLib(options);
            let label = lib.format(date, "PPPP");
            if (modifiers.today)
                label = `Astăzi, ${label}`;
            if (modifiers.selected)
                label = `${label}, selectat`;
            return label;
        },
        labelMonthDropdown: "Alege luna",
        labelNext: "Mergi la luna următoare",
        labelPrevious: "Mergi la luna anterioară",
        labelWeekNumber: (weekNumber) => `Săptămâna ${weekNumber}`,
        labelYearDropdown: "Alege anul",
        labelGrid: (date, options, dateLib) => (dateLib ?? new DateLib_js_1.DateLib(options)).formatMonthYear(date),
        labelGridcell: (date, modifiers, options, dateLib) => {
            const lib = dateLib ?? new DateLib_js_1.DateLib(options);
            let label = lib.format(date, "PPPP");
            if (modifiers?.today) {
                label = `Astăzi, ${label}`;
            }
            return label;
        },
        labelNav: "Bară de navigare",
        labelWeekNumberHeader: "Numărul săptămânii",
        labelWeekday: (date, options, dateLib) => (dateLib ?? new DateLib_js_1.DateLib(options)).format(date, "cccc"),
    },
};
