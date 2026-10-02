"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNavMonths = getNavMonths;
/**
 * Returns the start and end months for calendar navigation.
 *
 * @param props The DayPicker props, including navigation and layout options.
 * @param dateLib The date library to use for date manipulation.
 * @returns A tuple containing the start and end months for navigation.
 */
function getNavMonths(props, dateLib) {
    let { startMonth, endMonth } = props;
    const { startOfYear, startOfDay, startOfMonth, endOfMonth, addYears, endOfYear, today, } = dateLib;
    const hasYearDropdown = props.captionLayout === "dropdown" ||
        props.captionLayout === "dropdown-years";
    if (startMonth) {
        startMonth = startOfMonth(startMonth);
    }
    else if (!startMonth && hasYearDropdown) {
        startMonth = startOfYear(addYears(props.today ?? today(), -100));
    }
    if (endMonth) {
        endMonth = endOfMonth(endMonth);
    }
    else if (!endMonth && hasYearDropdown) {
        endMonth = endOfYear(props.today ?? today());
    }
    return [
        startMonth ? startOfDay(startMonth) : startMonth,
        endMonth ? startOfDay(endMonth) : endMonth,
    ];
}
