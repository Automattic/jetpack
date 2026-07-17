import { useCallback } from 'react';
import type { SurveyChoiceProps } from './types';
import type { FC, KeyboardEvent } from 'react';
import './_jp-connect_disconnect-survey-card.scss';

/**
 * SurveyChoice - Present one choice in the survey.
 *
 * @param {SurveyChoiceProps} props - The properties.
 * @return {import('react').ReactNode} The SurveyChoice component.
 */
const SurveyChoice: FC< SurveyChoiceProps > = ( {
	id,
	onClick,
	onKeyDown,
	children,
	className,
} ) => {
	const handleClick = useCallback( () => {
		onClick( id );
	}, [ id, onClick ] );

	const handleKeyDown = useCallback(
		( e: KeyboardEvent< HTMLDivElement > ) => {
			onKeyDown( id, e );
		},
		[ id, onKeyDown ]
	);

	return (
		<div
			tabIndex={ 0 }
			role="button"
			onClick={ handleClick }
			onKeyDown={ handleKeyDown }
			className={ 'card jp-connect__disconnect-survey-card ' + className }
		>
			{ children }
		</div>
	);
};

export default SurveyChoice;
