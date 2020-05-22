/**
 * External dependencies
 */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useState, useEffect } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';
import { getSetupWizardAnswer, updateSetupWizardQuestionnaire } from 'state/setup-wizard';

import './style.scss';

let ChecklistAnswer = props => {
	const { checked, title, details, answerKey, updateChecklistAnswerQuestion } = props;

	const [ expanded, setExpanded ] = useState( false );
	const [ windowWidth, setWindowWidth ] = useState( false );

	const handleResize = useCallback( () => {
		setWindowWidth( window.innerWidth <= 660 ? 'small' : 'large' );
	}, [ window.innerWidth ] );

	useEffect( () => {
		handleResize(); // Call this once to make sure windowWidth is initialized
		window.addEventListener( 'resize', handleResize );
		return () => {
			window.removeEventListener( 'resize', handleResize );
		};
	} );

	const toggleCheckboxLargeWindow = useCallback( () => {
		if ( 'small' === windowWidth ) {
			return;
		}

		const newCheckedValue = ! checked;
		updateChecklistAnswerQuestion( { [ answerKey ]: newCheckedValue } );
	}, [ checked, windowWidth ] );

	const toggleCheckboxSmallWindow = useCallback( () => {
		if ( 'large' === windowWidth ) {
			return;
		}

		const newCheckedValue = ! checked;
		updateChecklistAnswerQuestion( { [ answerKey ]: newCheckedValue } );
	}, [ checked, windowWidth ] );

	const toggleExpanded = useCallback( () => {
		setExpanded( ! expanded );
	}, [ expanded ] );

	const smallWindow = 'small' === windowWidth;

	const chevronIcon = expanded ? 'chevron-up' : 'chevron-down';

	return (
		<div
			className={ classNames( 'jp-checklist-answer-container', { checked } ) }
			onClick={ toggleCheckboxLargeWindow }
			onKeyPress={ toggleCheckboxLargeWindow }
			role="checkbox"
			aria-checked={ checked }
			tabIndex={ smallWindow ? -1 : 0 }
		>
			<div className="jp-checklist-answer-checkbox-container">
				<input
					type="checkbox"
					onClick={ toggleCheckboxSmallWindow }
					onKeyPress={ toggleCheckboxSmallWindow }
					tabIndex={ smallWindow ? 0 : -1 }
					checked={ checked }
				/>
			</div>
			<div className="jp-checklist-answer-title">
				<p>{ title }</p>
			</div>
			<div
				className={ classNames( 'jp-checklist-answer-details', {
					expanded,
				} ) }
			>
				<p>{ details }</p>
			</div>
			<div
				className={ classNames( 'jp-checklist-answer-chevron-container', {
					expanded,
				} ) }
				onClick={ toggleExpanded }
				onKeyPress={ toggleExpanded }
				role="button"
				tabIndex={ smallWindow ? 0 : -1 }
			>
				<Gridicon icon={ chevronIcon } size={ 21 } />
			</div>
		</div>
	);
};

ChecklistAnswer.propTypes = {
	answerKey: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	details: PropTypes.string.isRequired,
};

ChecklistAnswer = connect(
	( state, ownProps ) => ( {
		checked: getSetupWizardAnswer( state, ownProps.answerKey ),
	} ),
	dispatch => ( {
		updateChecklistAnswerQuestion: answer => dispatch( updateSetupWizardQuestionnaire( answer ) ),
	} )
)( ChecklistAnswer );

export { ChecklistAnswer };
