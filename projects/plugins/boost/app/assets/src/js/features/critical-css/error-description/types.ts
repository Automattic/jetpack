import { type ErrorSet } from '../lib/stores/critical-css-state-errors';

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
