"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fy = void 0;
const fy_1 = require("date-fns/locale/fy");
const DateLib_js_1 = require("../classes/DateLib.js");
/** Frisian locale extended with DayPicker-specific translations. */
exports.fy = {
    ...fy_1.fy,
    labels: {
        labelDayButton: (date, modifiers, options, dateLib) => {
            const lib = dateLib ?? new DateLib_js_1.DateLib(options);
            let label = lib.format(date, "PPPP");
            if (modifiers.today)
                label = `Hjoed, ${label}`;
            if (modifiers.selected)
                label = `${label}, selektearre`;
            return label;
        },
        labelMonthDropdown: "Kies de moanne",
        labelNext: "Nei folgjende moanne",
        labelPrevious: "Nei foarige moanne",
        labelWeekNumber: (weekNumber) => `Wike ${weekNumber}`,
        labelYearDropdown: "Kies it jier",
        labelGrid: (date, options, dateLib) => (dateLib ?? new DateLib_js_1.DateLib(options)).formatMonthYear(date),
        labelGridcell: (date, modifiers, options, dateLib) => {
            const lib = dateLib ?? new DateLib_js_1.DateLib(options);
            let label = lib.format(date, "PPPP");
            if (modifiers?.today) {
                label = `Hjoed, ${label}`;
            }
            return label;
        },
        labelNav: "Navigaasjebalke",
        labelWeekNumberHeader: "Wikenûmer",
        labelWeekday: (date, options, dateLib) => (dateLib ?? new DateLib_js_1.DateLib(options)).format(date, "cccc"),
    },
};
