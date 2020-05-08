/**
 * External dependencies
 */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useState, useEffect } from 'react';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';

import './style.scss';

const ChecklistAnswer = props => {
	const [ checked, setChecked ] = useState( false );
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

		setChecked( ! checked );
	}, [ checked, windowWidth ] );

	const toggleCheckboxSmallWindow = useCallback( () => {
		if ( 'large' === windowWidth ) {
			return;
		}

		setChecked( ! checked );
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
				<p>{ props.title }</p>
			</div>
			<div
				className={ classNames( 'jp-checklist-answer-details', {
					expanded,
				} ) }
			>
				<p>{ props.details }</p>
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
	title: PropTypes.string.isRequired,
	details: PropTypes.string.isRequired,
};

export { ChecklistAnswer };
