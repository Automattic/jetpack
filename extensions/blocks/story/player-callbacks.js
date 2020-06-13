/* global _wpmejsSettings, MediaElementPlayer */
/**
 * External dependencies
 */
import { forEach } from 'lodash';

const MOBILE_ASPECT_RATIO = 720 / 1280;
const SANITY_MAX_HEIGHT = 512; // 40% of 1280
const PAUSE_CLASS = 'wp-block-jetpack-story_autoplay-paused';

function playerInit( player ) {
	playerResize( player );
	playerApplyAria( player );
	player.el
		.querySelector( '.wp-block-jetpack-story_button-pause' )
		.addEventListener( 'click', function() {
			// Handle destroyed Swiper instances
			if ( ! player.el ) {
				return;
			}
			if ( player.el.classList.contains( PAUSE_CLASS ) ) {
				player.el.classList.remove( PAUSE_CLASS );
				player.autoplay.start();
				this.setAttribute( 'aria-label', 'Pause Story' );
			} else {
				player.el.classList.add( PAUSE_CLASS );
				player.autoplay.stop();
				this.setAttribute( 'aria-label', 'Play Story' );
			}
		} );
}

function playerResize( player ) {
	if ( ! player || ! player.el ) {
		return;
	}
	const img = player.el.querySelector( '.player-slide[data-player-slide-index="0"] img' );
	if ( ! img ) {
		return;
	}
	const aspectRatio = img.clientWidth / img.clientHeight;
	const sanityAspectRatio = Math.max( Math.min( aspectRatio, 1 ), MOBILE_ASPECT_RATIO );
	const playerHeight = Math.min( player.width / sanityAspectRatio, SANITY_MAX_HEIGHT );
	const wrapperHeight = `${ Math.floor( playerHeight ) }px`;

	player.el.classList.add( 'wp-player-initialized' );
	player.wrapperEl.style.height = wrapperHeight;
}

function playerApplyAria( player ) {
	forEach( player.slides, ( slide, index ) => {
		slide.setAttribute( 'aria-hidden', index === player.activeIndex ? 'false' : 'true' );
		if ( index === player.activeIndex ) {
			slide.setAttribute( 'tabindex', '-1' );
		} else {
			slide.removeAttribute( 'tabindex' );
		}
	} );
}

export { playerApplyAria, playerInit, playerResize };
