import clsx from 'clsx';
import { useCallback } from 'react';
import type { SurveyChoiceProps } from './types';
import './_jp-connect_disconnect-survey-card.scss';

/**
 * SurveyChoice - Present one choice in the survey.
 *
 * Renders a native radio so the browser supplies the radio-group semantics and
 * keyboard behaviour (arrow keys to move between options, one tab stop for the
 * whole group) rather than re-implementing them.
 *
 * @param {SurveyChoiceProps} props - The properties.
 * @return {import('react').ReactNode} The SurveyChoice component.
 */
function SurveyChoice( { id, name, label, checked, onSelect, children }: SurveyChoiceProps ) {
	const handleChange = useCallback( () => {
		onSelect( id );
	}, [ id, onSelect ] );

	const inputId = `${ name }--${ id }`;

	return (
		<div
			className={ clsx( 'card', 'jp-connect__disconnect-survey-card', {
				'jp-connect__disconnect-survey-card--selected': checked,
			} ) }
		>
			<input
				className="jp-connect__disconnect-survey-card__radio"
				type="radio"
				id={ inputId }
				name={ name }
				value={ id }
				checked={ checked }
				onChange={ handleChange }
			/>
			{ /* The label stretches over the whole card (see the stylesheet), so
			     clicking anywhere in the card still selects the option. */ }
			<label className="jp-connect__disconnect-survey-card__answer" htmlFor={ inputId }>
				{ label }
			</label>
			{ children }
		</div>
	);
}

export default SurveyChoice;
