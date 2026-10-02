"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.et = void 0;
const et_1 = require("date-fns/locale/et");
const DateLib_js_1 = require("../classes/DateLib.js");
/** Estonian locale extended with DayPicker-specific translations. */
exports.et = {
    ...et_1.et,
    labels: {
        labelDayButton: (date, modifiers, options, dateLib) => {
            const lib = dateLib ?? new DateLib_js_1.DateLib(options);
            let label = lib.format(date, "PPPP");
            if (modifiers.today)
                label = `Täna, ${label}`;
            if (modifiers.selected)
                label = `${label}, valitud`;
            return label;
        },
        labelMonthDropdown: "Vali kuu",
        labelNext: "Mine järgmisele kuule",
        labelPrevious: "Mine eelmisele kuule",
        labelWeekNumber: (weekNumber) => `Nädal ${weekNumber}`,
        labelYearDropdown: "Vali aasta",
        labelGrid: (date, options, dateLib) => (dateLib ?? new DateLib_js_1.DateLib(options)).formatMonthYear(date),
        labelGridcell: (date, modifiers, options, dateLib) => {
            const lib = dateLib ?? new DateLib_js_1.DateLib(options);
            let label = lib.format(date, "PPPP");
            if (modifiers?.today) {
                label = `Täna, ${label}`;
            }
            return label;
        },
        labelNav: "Navigeerimisriba",
        labelWeekNumberHeader: "Nädala number",
        labelWeekday: (date, options, dateLib) => (dateLib ?? new DateLib_js_1.DateLib(options)).format(date, "cccc"),
    },
};
