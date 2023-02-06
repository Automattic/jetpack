import React, { useCallback } from 'react';

import './_jp-connect_disconnect-survey-card.scss';

/**
 * SurveyChoice - Present one choice in the survey.
 *
 * @param {string} props.id - The ID/slug string of the survey option
 * @param {Function} props.onClick - Event handler for clicking on the survey option.
 * @param {Function} props.onKeydown - Event handler for pressing a key on the survey option.
 * @param {React.ElementType} props.children - Any passed elements as children to this component.
 * @param {string} props.className - A class name to apply to the survey choice.
 * @returns {React.Component} SurveyChoice - The SurveyChoice component.
 */

const SurveyChoice = props => {
	const { id, onClick, onKeyDown, children, className } = props;

	const handleClick = useCallback( () => {
		onClick( id );
	}, [ id, onClick ] );

	const handleKeyDown = useCallback(
		e => {
			onKeyDown( id, e );
		},
		[ id, onKeyDown ]
	);

	return (
		<div
			tabIndex="0"
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
