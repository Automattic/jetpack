/**
 * External dependencies
 */
import { useCallback, useEffect, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { ensurePlayer, releasePlayerId } from '../../../lib/inline-player/loader';
/**
 * Types
 */
import type { AssetConfig, PlayerHandle, PlayerOptions } from '../../../lib/inline-player/loader';
import type { RefObject } from 'react';

export type InlinePlayerConfig = AssetConfig & { preloadDisabled?: boolean };

export type UseInlinePlayerOptions = {
	/** The video to mount; nothing mounts without it. */
	guid?: string;
	/** Options for `videopress()`; the player remounts when they change. */
	options: PlayerOptions;
	/** Where the bundle lives; nothing mounts without it. */
	config?: InlinePlayerConfig | null;
	/** Time, in ms, to park the player at after its first play when previewing on hover. */
	initialTimePosition?: number;
	/** Element whose hover plays and pauses the preview loop. */
	wrapperElement?: HTMLElement | null;
	/** Preview-on-hover loop, in ms. */
	previewOnHover?: {
		atTime: number;
		duration: number;
	};
};

export type UseInlinePlayer = {
	/** Whether the player reported itself ready. */
	isLoaded: boolean;
	/** Whether the player played once and now takes commands. */
	playerIsReady: boolean;
	play: () => void;
	pause: () => void;
};

/**
 * The bundle config the block editor was given, when the site renders players in the page.
 *
 * @return The config, or null while the site embeds with iframes.
 */
export function getInlinePlayerConfig(): InlinePlayerConfig | null {
	const config = window?.videoPressEditorState?.inlinePlayer;
	return config?.script ? config : null;
}

/**
 * Mount a VideoPress player from the shared bundle into `containerRef`, and drive it the way
 * `useVideoPlayer` drives an iframed one.
 *
 * @param containerRef                 - The element the player mounts into.
 * @param settings                     - What to mount and how to drive it.
 * @param settings.guid                - The video to mount; nothing mounts without it.
 * @param settings.options             - Options for `videopress()`; the player remounts when they change.
 * @param settings.config              - Where the bundle lives; nothing mounts without it.
 * @param settings.initialTimePosition - Time, in ms, to park the player at after its first play when previewing on hover.
 * @param settings.wrapperElement      - Element whose hover plays and pauses the preview loop.
 * @param settings.previewOnHover      - Preview-on-hover loop, in ms.
 * @return Player state and controls.
 */
export default function useInlinePlayer(
	containerRef: RefObject< HTMLElement >,
	{
		guid,
		options,
		config,
		initialTimePosition,
		wrapperElement,
		previewOnHover,
	}: UseInlinePlayerOptions
): UseInlinePlayer {
	const [ isLoaded, setIsLoaded ] = useState( false );
	const [ playerIsReady, setPlayerIsReady ] = useState( false );
	const handleRef = useRef< PlayerHandle | null >( null );
	// The subscriptions are bound once per mount; they read the latest preview settings from here.
	const previewRef = useRef( { initialTimePosition, previewOnHover } );
	previewRef.current = { initialTimePosition, previewOnHover };

	const optionsKey = JSON.stringify( options );
	const script = config?.script;

	useEffect( () => {
		const container = containerRef.current;
		if ( ! container || ! guid || ! script || ! config ) {
			return;
		}

		let cancelled = false;
		let hasPlayed = false;
		setIsLoaded( false );
		setPlayerIsReady( false );

		ensurePlayer( container.ownerDocument, config )
			.then( factory => {
				if ( cancelled ) {
					return;
				}
				// Right before mounting: blocks waiting on the same download mount back to back.
				releasePlayerId( guid, container );
				const handle = factory( guid, container, {
					width: container.offsetWidth,
					height: container.offsetHeight,
					fill: true,
					...JSON.parse( optionsKey ),
				} );
				if ( ! handle ) {
					return;
				}
				handleRef.current = handle;

				const api = handle.api;
				if ( ! api ) {
					setIsLoaded( true );
					setPlayerIsReady( true );
					return;
				}

				api.status.onPlayerStatusChanged( ( _previous, status ) => {
					if ( status === 'ready' ) {
						setIsLoaded( true );
					}
					if ( status !== 'playing' || hasPlayed ) {
						return;
					}
					hasPlayed = true;
					// Preview-on-hover autoplays only to get the player going; park it at the preview start.
					const preview = previewRef.current;
					if ( preview.previewOnHover ) {
						api.controls.pause();
						if ( typeof preview.initialTimePosition !== 'undefined' ) {
							api.controls.seek( preview.initialTimePosition );
						}
					}
					setPlayerIsReady( true );
				} );

				api.status.onTimeUpdate( seconds => {
					const loop = previewRef.current.previewOnHover;
					if ( ! loop ) {
						return;
					}
					const ms = seconds * 1000;
					if ( ms < loop.atTime || ms > loop.atTime + loop.duration ) {
						api.controls.seek( loop.atTime );
					}
				} );
			} )
			.catch( () => {} );

		return () => {
			cancelled = true;
			handleRef.current?.destroy();
			handleRef.current = null;
			container.replaceChildren();
		};
	}, [ containerRef, guid, optionsKey, script ] );

	const play = useCallback( () => {
		if ( playerIsReady ) {
			handleRef.current?.api?.controls.play();
		}
	}, [ playerIsReady ] );

	const pause = useCallback( () => {
		if ( playerIsReady ) {
			handleRef.current?.api?.controls.pause();
		}
	}, [ playerIsReady ] );

	const isPreviewOnHoverEnabled = !! previewOnHover;

	useEffect( () => {
		if ( ! wrapperElement || ! isPreviewOnHoverEnabled ) {
			return;
		}

		wrapperElement.addEventListener( 'mouseenter', play );
		wrapperElement.addEventListener( 'mouseleave', pause );

		return () => {
			wrapperElement.removeEventListener( 'mouseenter', play );
			wrapperElement.removeEventListener( 'mouseleave', pause );
		};
	}, [ isPreviewOnHoverEnabled, wrapperElement, play, pause ] );

	// Follow the preview's starting point and duration as they are edited.
	useEffect( () => {
		if ( playerIsReady && previewOnHover ) {
			handleRef.current?.api?.controls.seek( previewOnHover.atTime );
		}
	}, [ previewOnHover?.atTime, playerIsReady ] );

	useEffect( () => {
		if ( playerIsReady && previewOnHover ) {
			handleRef.current?.api?.controls.seek( previewOnHover.atTime + previewOnHover.duration );
		}
	}, [ previewOnHover?.duration, playerIsReady ] );

	return { isLoaded, playerIsReady, play, pause };
}
