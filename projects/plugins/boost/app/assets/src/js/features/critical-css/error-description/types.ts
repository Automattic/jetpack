import { type ErrorSet } from '../lib/critical-css-errors';

export type CriticalCssErrorDescriptionTypes = {
	errorSet: ErrorSet;
	showSuggestion?: boolean;
	foldRawErrors?: boolean;
	showClosingParagraph?: boolean;
};

export type FormattedURL = {
	/**
	 * The URL to display in the list.
	 */
	href: string;
	/**
	 * The URL to link to.
	 */
	label: string;
};
