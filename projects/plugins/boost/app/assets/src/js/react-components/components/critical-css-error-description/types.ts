import { type ErrorSet } from '../../../stores/critical-css-state-errors';
import { type InterpolateVars } from '../../utils/interplate-vars-types';

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

export type MoreListTypes = {
	entries: FormattedURL[];
	showLimit?: number;
};

export type SuggestionTypes = {
	errorSet: ErrorSet;
	interpolateVars: InterpolateVars;
	showClosingParagraph: boolean;
};

export type NumberedListTypes = {
	items: string[];
	interpolateVars: InterpolateVars;
};
