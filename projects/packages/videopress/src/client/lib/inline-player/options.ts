/**
 * Builds the options an in-page player takes from video block attributes.
 *
 * Mirrors `Inline_Player::get_player_options()`, which does the same for server-rendered embeds.
 */
import type { PlayerOptions } from './loader';

export type InlinePlayerAttributes = {
	autoplay?: boolean;
	controls?: boolean;
	loop?: boolean;
	muted?: boolean;
	playsinline?: boolean;
	poster?: string;
	preload?: string;
	seekbarColor?: string;
	seekbarPlayedColor?: string;
	seekbarLoadingColor?: string;
	useAverageColor?: boolean;
};

const PRELOAD_VALUES = [ 'auto', 'metadata', 'none' ];

/**
 * Map block attributes to player options.
 *
 * @param attributes               - The block attributes.
 * @param settings                 - Site-level settings that override attributes.
 * @param settings.preloadDisabled - Whether the site turned player preloading off.
 * @return The options for `videopress()`.
 */
export function getInlinePlayerOptions(
	attributes: InlinePlayerAttributes,
	{ preloadDisabled = false }: { preloadDisabled?: boolean } = {}
): PlayerOptions {
	const muted = !! attributes.muted;
	let preload =
		typeof attributes.preload === 'string' ? attributes.preload.toLowerCase() : 'metadata';
	if ( ! PRELOAD_VALUES.includes( preload ) ) {
		preload = 'metadata';
	}
	if ( preloadDisabled ) {
		preload = 'none';
	}

	const options: PlayerOptions = {
		autoPlay: !! attributes.autoplay,
		controls: attributes.controls !== false,
		loop: !! attributes.loop,
		muted,
		persistVolume: ! muted,
		playsinline: !! attributes.playsinline,
		cover: true,
		hd: false,
		useAverageColor: attributes.useAverageColor !== false,
		preloadContent: preload,
		chrome: 'v2',
	};

	if ( attributes.poster ) {
		options.poster = attributes.poster;
	}

	const colors: Array< [ keyof InlinePlayerAttributes, string ] > = [
		[ 'seekbarColor', 'seekbarColor' ],
		[ 'seekbarPlayedColor', 'seekbarPlayedColor' ],
		[ 'seekbarLoadingColor', 'seekbarLoadedColor' ],
	];
	colors.forEach( ( [ attribute, option ] ) => {
		const value = attributes[ attribute ];
		if ( typeof value === 'string' && value !== '' ) {
			options[ option ] = value;
		}
	} );

	return options;
}
