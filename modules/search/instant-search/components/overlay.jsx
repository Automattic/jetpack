/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { __ } from '@wordpress/i18n';

const Overlay = ( { showOverlay, toggleOverlay, children } ) => {
	const closeOnEscapeKey = event => {
		if ( event.key === 'Escape' ) {
			toggleOverlay();
		}
	};

	useEffect( () => {
		window.addEventListener( 'keydown', closeOnEscapeKey );
		return () => {
			// Cleanup after event
			window.removeEventListener( 'keydown', closeOnEscapeKey );
		};
	}, [] );

	const classNames = [ 'jetpack-instant-search__overlay' ];
	if ( ! showOverlay ) {
		classNames.push( 'is-hidden' );
	}

	return (
		<div className={ classNames.join( ' ' ) }>
			<button className="jetpack-instant-search__overlay-close" onClick={ toggleOverlay }>
				{ __( 'Close', 'jetpack' ) }
			</button>
			{ children }
		</div>
	);
};

export default Overlay;
