import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import type { ReactElement } from 'react';

/*
 * The intro film that heads the welcome modal.
 *
 * VideoPress-hosted only: the modal's whole argument is "look at the player",
 * and a VideoPress-hosted asset means the thing doing the arguing IS the
 * player — captions, quality selector and all. It also dogfoods the product on
 * the screen that sells it. No film ships in the plugin bundle (a bundled
 * `.mp4` was rejected for the package weight, and a native `<video>` makes the
 * pitch without proving it); until the hosted asset exists the band shows the
 * wireframe brand artwork on its own.
 *
 * TODO(VIDP): upload the finished 28s intro film to a VideoPress account the
 * team controls and set `INTRO_VIDEO_GUID`.
 */
const INTRO_VIDEO_GUID = '';

// The intro film is 1920x1080; the band takes its shape from the asset.
export const INTRO_VIDEO_ASPECT = '16 / 9';

/**
 * Build the public URL for a file shipped in the dashboard build.
 *
 * Exported because every one of the modal's bundled assets needs it, not just
 * the film: the stylesheet is injected by JS, so a relative `url()` written in
 * SCSS resolves against `/wp-admin/` and 404s. Anything referencing this folder
 * has to resolve against the build URL the server hands us.
 *
 * @param file - Filename inside the onboarding-modal asset folder.
 * @return Public URL, or undefined when initial state is unavailable.
 */
export function getAssetUrl( file: string ): string | undefined {
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
	if ( ! INTRO_VIDEO_GUID ) {
		return null;
	}

	return (
		<iframe
			className="vp-onboarding-modal__player"
			src={ getEmbedUrl( INTRO_VIDEO_GUID, ! prefersReducedMotion() ) }
			title={ __( 'What VideoPress does', 'jetpack-videopress-pkg' ) }
			allow="autoplay; clipboard-write"
			allowFullScreen
		/>
	);
}
