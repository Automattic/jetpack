/**
 * External Dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Internal Dependencies
 */
import './_jp-connect_disconnect-survey-card.scss';

/**
 * SurveyChoice - Present one choice in the survey.
 *
 * @returns {React.Component} SurveyChoice - The SurveyChoice component.
 */

const SurveyChoice = props => {
	const { id, onChange, onKeyDown, children, className, surveyName, label, isSelected } = props;

	const handleChange = useCallback( () => {
		onChange( id );
	}, [ id, onChange ] );

	const handleKeyDown = useCallback(
		e => {
			onKeyDown( id, e );
		},
		[ id, onKeyDown ]
	);

	return (
		<div className={ 'card jp-connect__disconnect-survey-card ' + className }>
			<input
				type="radio"
				value={ id }
				id={ 'survey-choice-' + id }
				name={ surveyName }
				onChange={ handleChange }
				onKeyDown={ handleKeyDown }
				checked={ isSelected }
				className="jp-connect__disconnect-survey-card__radio"
			/>
			<label
				className="jp-connect__disconnect-survey-card__label"
				htmlFor={ 'survey-choice-' + id }
			>
				{ label }
			</label>

			{ children }
		</div>
	);
};

SurveyChoice.PropTypes = {
	/** The ID/slug string of the survey option */
	id: PropTypes.string,
	/** Event handler for clicking on the survey option. */
	onChange: PropTypes.func,
	/** Event handler for pressing a key on the survey option. */
	onKeyDown: PropTypes.func,
	/** Any passed elements as children to this component. */
	children: React.ElementType,
	/** A class name to apply to the survey choice. */
	className: PropTypes.string,
	/** The name of the survey this choice belongs to (used to group radio buttons) */
	surveyName: PropTypes.string,
	/** Label text to use for this survey choice */
	label: PropTypes.string,
	/** Whether or not this survey option is selected */
	isSelected: PropTypes.bool,
};

export default SurveyChoice;
