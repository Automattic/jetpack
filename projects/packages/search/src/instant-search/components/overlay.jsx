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
	// IE11 uses 'Esc'
	if ( event.key === 'Escape' || event.key === 'Esc' ) {
		event.preventDefault();
		callback();
	}
};

const Overlay = props => {
	const { children, closeOverlay, colorTheme, hasOverlayWidgets, isVisible } = props;

	const closeWithEscape = callOnEscapeKey( closeOverlay );
	useEffect( () => {
		window.addEventListener( 'keydown', closeWithEscape );
		return () => {
			// Cleanup after event
			window.removeEventListener( 'keydown', closeWithEscape );
		};
	}, [ closeWithEscape ] );

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
