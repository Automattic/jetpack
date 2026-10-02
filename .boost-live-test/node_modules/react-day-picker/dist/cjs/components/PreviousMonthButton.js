"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviousMonthButton = PreviousMonthButton;
const react_1 = __importDefault(require("react"));
/**
 * Render the button to navigate to the previous month in the calendar.
 *
 * @group Components
 * @see https://daypicker.dev/guides/custom-components
 */
function PreviousMonthButton(props) {
    return react_1.default.createElement("button", { ...props });
}
