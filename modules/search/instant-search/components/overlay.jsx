/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { __ } from '@wordpress/i18n';

const Overlay = ( { showOverlay, toggleOverlay, children } ) => {
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
