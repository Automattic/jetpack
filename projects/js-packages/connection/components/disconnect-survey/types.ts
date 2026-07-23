import type { KeyboardEvent, ReactNode } from 'react';

export interface SurveyChoiceProps {
	/** The ID/slug string of the survey option. */
	id: string;
	/** Event handler for clicking on the survey option. */
	onClick: ( id: string ) => void;
	/** Event handler for pressing a key on the survey option. */
	onKeyDown: ( id: string, e: KeyboardEvent< HTMLDivElement > ) => void;
	/** Any passed elements as children to this component. */
	children?: ReactNode;
	/** A class name to apply to the survey choice. */
	className: string;
}
