import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
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

		const handleTabEvent = event => {
			if ( event.key === 'Tab' ) {
				const overlay = document.getElementsByClassName( 'jetpack-instant-search__overlay' )[ 0 ];
				const isInsideOverlay = overlay.contains( event.target );

				// Looking up the searchInput assumes knowledge of another component.
				const searchInput = document.getElementById( 'jetpack-instant-search__box-input-1' );
				const tabAnchor = document.getElementById( 'jetpack-instant-search__overlay-tab-anchor' );
				if ( event.shiftKey === true ) {
					if ( event.target === searchInput || false === isInsideOverlay ) {
						event.preventDefault();
						tabAnchor.focus();
					}
				}
				if ( event.shiftKey === false ) {
					if ( event.target === tabAnchor || false === isInsideOverlay ) {
						event.preventDefault();
						searchInput.focus();
					}
				}
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

		const addEventListeners = () => {
			window.addEventListener( 'click', closeWithOutsideClick );
			window.addEventListener( 'keydown', closeWithEscape );
			window.addEventListener( 'keydown', handleTabEvent );
		};

		const removeEventListeners = () => {
			window.removeEventListener( 'click', closeWithOutsideClick );
			window.removeEventListener( 'keydown', closeWithEscape );
			window.removeEventListener( 'keydown', handleTabEvent );
		};

		// Ensures that the click closed handler only fires when the overlay is active.
		// This ensures it doesn't erroneously intercept filter links or overlay spawner buttons.
		if ( isVisible ) {
			addEventListeners();
		} else {
			removeEventListeners();
		}

		return () => {
			// Cleanup on component dismount
			removeEventListeners();
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
