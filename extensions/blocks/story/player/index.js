/**
 * External dependencies
 */
import { merge } from 'lodash';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { Player } from './player';
import ShadowRoot from './lib/shadow-root';

const defaultSettings = {
	imageTime: 5000,
	startMuted: false,
	playInFullscreen: true,
	playOnNextSlide: true,
	playOnLoad: false,
	exitFullscreenOnEnd: true,
	loadInFullscreen: false,
	blurredBackground: true,
	showSlideCount: false,
	shadowDOM: {
		enabled: true,
		mode: 'open', // closed not supported right now
		globalStyleElements:
			'#jetpack-block-story-css, link[href*="jetpack/_inc/blocks/story/view.css"]',
	},
	defaultAspectRatio: 720 / 1280,
	cropUpTo: 0.2, // crop percentage allowed, after which media is displayed in letterbox
	volume: 0.5,
	renderInterval: 50, // in ms
};

export default function StoryPlayer( { slides, metadata, disabled, ...settings } ) {
	const playerSettings = merge( {}, defaultSettings, settings );

	return (
		<ShadowRoot { ...playerSettings.shadowDOM }>
			<Player slides={ slides } metadata={ metadata } disabled={ disabled } { ...playerSettings } />
		</ShadowRoot>
	);
}
