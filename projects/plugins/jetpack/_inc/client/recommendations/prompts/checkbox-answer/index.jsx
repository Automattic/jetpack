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
	const toggleCheckbox = useCallback(
		e => {
			if ( e.target.type !== 'checkbox' ) {
				return;
			}
			const newCheckedValue = ! checked;
			updateCheckboxAnswer( { [ answerKey ]: newCheckedValue } );
		},
		[ answerKey, checked, updateCheckboxAnswer ]
	);

	const stopEventPropagation = useCallback( e => {
		e.stopPropagation();
	}, [] );

	const onPopoverClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_site_type_popover_click', {
			type: answerKey.replace( '-', '_' ),
		} );
	}, [ answerKey ] );

	return (
		<div
			className={ classNames( 'jp-checkbox-answer__container', { checked } ) }
			onClick={ toggleCheckbox }
			onKeyPress={ toggleCheckbox }
			role="checkbox"
			aria-checked={ checked }
			tabIndex={ 0 }
		>
			<div className="jp-checkbox-answer__checkbox">
				<input id={ answerKey } type="checkbox" defaultChecked={ checked } tabIndex={ -1 } />
			</div>
			<label htmlFor={ answerKey } className="jp-checkbox-answer__title">
				{ title }
			</label>
			<div
				className="jp-checkbox-answer__info"
				onClick={ stopEventPropagation }
				onKeyPress={ stopEventPropagation }
				role="presentation"
			>
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
