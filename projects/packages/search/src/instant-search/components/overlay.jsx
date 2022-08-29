import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import {
	OVERLAY_CLASS_NAME,
	OVERLAY_SEARCH_BOX_INPUT_CLASS_NAME,
	OVERLAY_FOCUS_ANCHOR_ID,
} from '../lib/constants';
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
				// Looking up the overlay and its first and last elements assumes knowledge of other components.
				// We currently try to mimimize any side effects by relying on constants for these class names/ids.
				const overlay = document.getElementsByClassName( OVERLAY_CLASS_NAME )[ 0 ];
				const isInsideOverlay = overlay.contains( event.target );
				const focusTrapFirstElement = document.getElementsByClassName(
					OVERLAY_SEARCH_BOX_INPUT_CLASS_NAME
				)[ 0 ];
				const focusTrapLastElement = document.getElementById( OVERLAY_FOCUS_ANCHOR_ID );

				// Trap any Tab key events and make sure focus stays within the overlay.
				if ( event.shiftKey === true ) {
					if ( event.target === focusTrapFirstElement || false === isInsideOverlay ) {
						event.preventDefault();
						focusTrapLastElement.focus();
					}
				}
				if ( event.shiftKey === false ) {
					if ( event.target === focusTrapLastElement || false === isInsideOverlay ) {
						event.preventDefault();
						focusTrapFirstElement.focus();
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
