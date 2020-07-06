/**
 * External dependencies
 */
import classNames from 'classnames';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import player from './player';

const storyPlayerSettings = {
	slides: [],
	shadowDOM: { enabled: false },
	playInFullScreen: false,
	tapToPlayPause: true,
};

export default function Story( { className, isSelected, mediaFiles, mountPlayer = true } ) {
	let mountRef;
	// cannot call useRef for save()
	if ( mountPlayer ) {
		mountRef = useRef();

		useEffect( () => {
			// render player asynchronously to avoid interacting with its UI
			// when focusing on the block
			setTimeout( () => {
				player( mountRef.current, {
					...storyPlayerSettings,
					slides: mediaFiles,
					disabled: ! isSelected,
				} );
			}, 0 );
		}, [ mediaFiles, isSelected ] );
	}

	return <div className={ classNames( `wp-story`, className ) } ref={ mountRef }></div>;
}
