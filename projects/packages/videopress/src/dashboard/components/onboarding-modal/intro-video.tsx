import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import type { ReactElement } from 'react';

/*
 * The intro film that heads the welcome modal.
 *
 * Two sources, in preference order:
 *
 * 1. A VideoPress GUID. This is the one we want — the modal's whole argument
 *    is "look at the player", and a VideoPress-hosted asset means the thing
 *    doing the arguing IS the player: captions, quality selector and all. It
 *    also dogfoods the product on the screen that sells it.
 * 2. The film bundled into the build. The honest fallback while the hosted
 *    asset doesn't exist: a native `<video>` shows the film but NOT the
 *    player, so it makes the pitch without proving it.
 *
 * TODO(VIDP): upload the finished 28s intro film to a VideoPress account the
 * team controls and set `INTRO_VIDEO_GUID`. Until then the bundled file ships.
 *
 * PLACEHOLDER ASSET — the bundled film's footage and music are stand-ins and
 * are NOT cleared for release. A fully licensed video replaces this before
 * release; do not treat the current file as final or reuse it elsewhere.
 */
const INTRO_VIDEO_GUID = '';

// Lives beside the modal's images so it rides the same CopyWebpackPlugin
// rule. That pattern is extension-scoped — `.mp4` is listed there, or this
// silently 404s. See webpack.config.js.
const INTRO_VIDEO_FILE = 'videopress-intro.mp4';

// The intro film is 1920x1080; the band takes its shape from the asset.
export const INTRO_VIDEO_ASPECT = '16 / 9';

/**
 * Build the public URL for a file shipped in the dashboard build.
 *
 * @param file - Filename inside the onboarding-modal asset folder.
 * @return Public URL, or undefined when initial state is unavailable.
 */
function getAssetUrl( file: string ): string | undefined {
	const buildUrl =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
			? JPVIDEOPRESS_INITIAL_STATE?.assets?.buildUrl
			: undefined;

	if ( ! buildUrl ) {
		return undefined;
	}

	// `new URL` THROWS on a malformed or relative base. A bad buildUrl must
	// cost the modal its video band, not take down the dashboard with it.
	try {
		return new URL( `dashboard/onboarding-modal/images/${ file }`, buildUrl ).href;
	} catch {
		return undefined;
	}
}

/*
 * Autoplay is the marketing intent — the band should be moving when the
 * modal opens — but it must yield to the OS-level reduced-motion setting.
 * Both sources (embed and native fallback) key off the same check so the
 * modal behaves identically whichever one renders.
 */
const prefersReducedMotion = () =>
	typeof window !== 'undefined' &&
	Boolean( window.matchMedia?.( '(prefers-reduced-motion: reduce)' ).matches );

/*
 * Same embed shape the Video details screen uses (see
 * `video-details/preview-player.tsx`): `resizeToParent` lets the player size
 * itself to the iframe, which the stylesheet pins to 16:9. No playback token
 * here — unlike a user's own video, the intro asset is always public.
 */
const getEmbedUrl = ( guid: string, autoplay: boolean ) =>
	addQueryArgs( `https://videopress.com/embed/${ guid }`, {
		resizeToParent: true,
		...( autoplay ? { autoplay: 1, muted: 1, loop: 1, playsinline: 1 } : {} ),
	} );

/**
 * The video band at the top of the welcome modal.
 *
 * @return The player, or null when no intro asset is configured.
 */
export default function IntroVideo(): ReactElement | null {
	const autoplay = ! prefersReducedMotion();

	if ( INTRO_VIDEO_GUID ) {
		return (
			<iframe
				className="vp-onboarding-modal__player"
				src={ getEmbedUrl( INTRO_VIDEO_GUID, autoplay ) }
				title={ __( 'What VideoPress does', 'jetpack-videopress-pkg' ) }
				allow="autoplay; clipboard-write"
				allowFullScreen
			/>
		);
	}

	const src = getAssetUrl( INTRO_VIDEO_FILE );

	if ( ! src ) {
		return null;
	}

	return (
		<video
			className="vp-onboarding-modal__player"
			// Same name the embed branch above gives its iframe: a media
			// element with controls is a focus stop, and without this one it
			// announced as an unnamed "video".
			aria-label={ __( 'What VideoPress does', 'jetpack-videopress-pkg' ) }
			src={ src }
			controls
			playsInline
			muted
			autoPlay={ autoplay }
			loop={ autoplay }
			preload="auto"
		/>
	);
}
