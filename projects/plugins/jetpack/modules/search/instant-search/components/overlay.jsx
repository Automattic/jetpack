/** @jsx h */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { h } from 'preact';
import { useEffect } from 'preact/hooks';

/**
 * Internal dependencies
 */
import './overlay.scss';

const callOnEscapeKey = callback => event => {
	// IE11 uses 'Esc'
	( event.key === 'Escape' || event.key === 'Esc' ) && callback();
};

const Overlay = props => {
	const { children, closeOverlay, colorTheme, hasOverlayWidgets, isVisible, opacity } = props;

	const closeWithEscape = callOnEscapeKey( closeOverlay );
	useEffect( () => {
		window.addEventListener( 'keydown', closeWithEscape );
		return () => {
			// Cleanup after event
			window.removeEventListener( 'keydown', closeWithEscape );
		};
	}, [] );

	return (
		<div
			aria-labelledby="jetpack-instant-search__overlay-title"
			className={ [
				'jetpack-instant-search__overlay',
				`jetpack-instant-search__overlay--${ colorTheme }`,
				hasOverlayWidgets ? '' : 'jetpack-instant-search__overlay--no-sidebar',
				isVisible ? '' : 'is-hidden',
			].join( ' ' ) }
			role="dialog"
			style={ { opacity: isVisible ? opacity / 100 : 0 } }
		>
			<h1 id="jetpack-instant-search__overlay-title" className="screen-reader-text">
				{ __( 'Search results', 'jetpack' ) }
			</h1>
			{ children }
		</div>
	);
};

export default Overlay;
