/**
 * External dependencies
 */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import InfoPopover from 'components/info-popover';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { getDataByKey, updateRecommendationsData } from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const CheckboxAnswerComponent = ( { answerKey, checked, info, title, updateCheckboxAnswer } ) => {
	const toggleCheckbox = useCallback( () => updateCheckboxAnswer( { [ answerKey ]: ! checked } ), [
		answerKey,
		checked,
		updateCheckboxAnswer,
	] );

	const onPopoverClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_site_type_popover_click', {
			type: answerKey.replace( '-', '_' ),
		} );
	}, [ answerKey ] );

	return (
		<div className="jp-checkbox-answer__container">
			<div className={ classNames( 'jp-checkbox-answer__checkbox', { checked } ) }>
				<input
					id={ answerKey }
					className="jp-checkbox-answer__checkbox-input"
					type="checkbox"
					checked={ checked }
					onChange={ toggleCheckbox }
				/>
				<label htmlFor={ answerKey } className="jp-checkbox-answer__title">
					{ title }
				</label>
			</div>
			<div className="jp-checkbox-answer__info">
				<InfoPopover position="top right" onClick={ onPopoverClick }>
					{ info }
				</InfoPopover>
			</div>
		</div>
	);
};

CheckboxAnswerComponent.propTypes = {
	answerKey: PropTypes.string.isRequired,
	info: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
};

const CheckboxAnswer = connect(
	( state, ownProps ) => ( {
		checked: getDataByKey( state, ownProps.answerKey ),
	} ),
	dispatch => ( {
		updateCheckboxAnswer: answer => dispatch( updateRecommendationsData( answer ) ),
	} )
)( CheckboxAnswerComponent );

export { CheckboxAnswer };
