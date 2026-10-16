import type { ReactNode } from 'react';

export interface SurveyChoiceProps {
	/** The ID/slug string of the survey option. Used as the radio's value. */
	id: string;
	/** The `name` shared by every radio in the survey, which forms the radio group. */
	name: string;
	/** The visible label for this option. */
	label: ReactNode;
	/** Whether this option is the currently selected one. */
	checked: boolean;
	/** Called with the option's ID when this option is selected. */
	onSelect: ( id: string ) => void;
	/**
	 * Extra content rendered inside the card, beside the label.
	 */
	children?: ReactNode;
}
