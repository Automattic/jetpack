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

const Overlay = props => {
	const { children, closeOverlay, colorTheme, hasOverlayWidgets, isVisible } = props;

	useEffect( () => {
		const closeWithEscape = event => {
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				closeOverlay();
			}
		};

		const closeWithOutsideClick = event => {
			const resultsContainer = document.getElementsByClassName(
				'jetpack-instant-search__search-results'
			)[ 0 ];
			if (
				event.target?.isConnected && // Ensure that the click target is still connected to DOM.
				resultsContainer &&
				! resultsContainer.contains( event.target )
			) {
				closeOverlay();
			}
		};

		window.addEventListener( 'keydown', closeWithEscape );

		// Ensures that the click closed handler only fires when the overlay is active.
		// This ensures it doesn't erroneously intercept filter links or overlay spawner buttons.
		if ( isVisible ) {
			window.addEventListener( 'click', closeWithOutsideClick );
		} else {
			window.removeEventListener( 'click', closeWithOutsideClick );
		}

		return () => {
			// Cleanup on component dismount
			window.removeEventListener( 'keydown', closeWithEscape );
			window.removeEventListener( 'click', closeWithOutsideClick );
		};
	}, [ closeOverlay, isVisible ] );

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
