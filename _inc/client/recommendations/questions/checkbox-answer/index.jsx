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
import { getDataByKey, updateRecommendationsData } from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const CheckboxAnswerComponent = ( { answerKey, checked, info, title, updateCheckboxAnswer } ) => {
	const toggleCheckbox = useCallback( () => {
		const newCheckedValue = ! checked;
		updateCheckboxAnswer( { [ answerKey ]: newCheckedValue } );
	} );

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
				<input type="checkbox" checked={ checked } tabIndex={ -1 } />
			</div>
			<div className="jp-checkbox-answer__title">{ title }</div>
			<div className="jp-checkbox-answer__info">
				<InfoPopover position="top right">{ info }</InfoPopover>
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
