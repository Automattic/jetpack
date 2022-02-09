/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';

/**
 * Internal dependencies
 */
import { OVERLAY_CLASS_NAME } from '../lib/constants';
import './overlay.scss';

const callOnEscapeKey = callback => event => {
	if ( event.key === 'Escape' ) {
		event.preventDefault();
		callback();
	}
};

const callOnOutsideClick = callback => {
	return event => {
		const resultsContainer = document.getElementsByClassName(
			'jetpack-instant-search__search-results'
		)[ 0 ];
		if ( resultsContainer && ! resultsContainer.contains( event.target ) ) {
			callback();
		}
	};
};

const Overlay = props => {
	const { children, closeOverlay, colorTheme, hasOverlayWidgets, isVisible } = props;

	const closeWithEscape = callOnEscapeKey( closeOverlay );
	const closeWithOutsideClick = callOnOutsideClick( closeOverlay );
	useEffect( () => {
		window.addEventListener( 'keydown', closeWithEscape );
		window.addEventListener( 'click', closeWithOutsideClick );
		return () => {
			// Cleanup on component dismount
			window.removeEventListener( 'keydown', closeWithEscape );
			window.removeEventListener( 'click', closeWithOutsideClick );
		};
	}, [ closeWithEscape, closeWithOutsideClick ] );

	return (
		<div
			aria-hidden={ ! isVisible }
			aria-labelledby="jetpack-instant-search__overlay-title"
			className={ [
				'jetpack-instant-search',
				OVERLAY_CLASS_NAME,
				`jetpack-instant-search__overlay--${ colorTheme }`,
				hasOverlayWidgets ? '' : 'jetpack-instant-search__overlay--no-sidebar',
				isVisible ? '' : 'is-hidden',
			].join( ' ' ) }
			role="dialog"
		>
			<h1 id="jetpack-instant-search__overlay-title" className="screen-reader-text">
				{ __( 'Search results', 'jetpack-search-pkg' ) }
			</h1>
			{ children }
		</div>
	);
};

export default Overlay;
