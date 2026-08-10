import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import type { ReactElement } from 'react';

/*
 * The intro clip that heads the welcome modal.
 *
 * Two sources, in preference order:
 *
 * 1. A VideoPress GUID. This is the one we want — the modal's whole argument is
 *    "look at the player", and a VideoPress-hosted asset means the thing doing
 *    the arguing IS the player, captions, quality selector and all. It also
 *    dogfoods the product on the screen that sells it.
 * 2. A file bundled into the build. The honest fallback while the hosted asset
 *    doesn't exist: a native `<video>` shows the content but NOT the player, so
 *    it makes the pitch without proving it.
 *
 * TODO(VIDP-363): upload the finished 30s explainer to a VideoPress account we
 * control and set `INTRO_VIDEO_GUID`. Until then the bundled file ships, and
 * the modal still works with neither (the media band simply doesn't render).
 */
const INTRO_VIDEO_GUID = '';

// Lives beside the modal's images so it rides the same CopyWebpackPlugin rule.
// That pattern is extension-scoped — `.mp4` had to be added to it, or this
// silently 404s. See webpack.config.js.
const INTRO_VIDEO_FILE = 'videopress-intro.mp4';
const INTRO_POSTER_FILE = 'videopress-cover-2x.png';

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

	return new URL( `dashboard/onboarding-modal/images/${ file }`, buildUrl ).href;
}

/*
 * Same embed shape the Video details screen uses (see
 * `video-details/preview-player.tsx`): `resizeToParent` lets the player size
 * itself to the iframe, which the stylesheet pins to 16:9. No playback token
 * here — unlike a user's own video, the intro asset is always public.
 */
const getEmbedUrl = ( guid: string ) =>
	addQueryArgs( `https://videopress.com/embed/${ guid }`, { resizeToParent: true } );

/**
 * The video band at the top of the welcome modal.
 *
 * @return The player, or null when no intro asset is configured.
 */
export default function IntroVideo(): ReactElement | null {
	if ( INTRO_VIDEO_GUID ) {
		return (
			<iframe
				className="vp-onboarding-modal__player"
				src={ getEmbedUrl( INTRO_VIDEO_GUID ) }
				title={ __( 'What VideoPress does', 'jetpack-videopress-pkg' ) }
				allow="clipboard-write"
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
			src={ src }
			poster={ getAssetUrl( INTRO_POSTER_FILE ) }
			controls
			playsInline
			preload="metadata"
		/>
	);
}
