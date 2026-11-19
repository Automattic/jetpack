import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { recordSeoEvent } from './record-seo-event';
import type { SeoTracksScreen } from './record-seo-event';

interface EnableSeoTools {
	/** Whether the enable request is in flight. */
	isEnabling: boolean;
	/** Activate the `seo-tools` module, then reload. */
	enable: () => Promise< void >;
}

/**
 * Turn the `seo-tools` module on from the SEO page; turning it off lives in My Jetpack.
 * Reloads on success, since the server registers the rest of the surface only while the
 * module is active; a snackbar wouldn't survive that, so only failure shows a notice.
 *
 * @param screen - The screen the button was used from, for Tracks.
 * @return The enable controller.
 */
export default function useEnableSeoTools( screen: SeoTracksScreen ): EnableSeoTools {
	const [ isEnabling, setIsEnabling ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );

	const enable = useCallback( async () => {
		setIsEnabling( true );
		try {
			await apiFetch( {
				path: '/jetpack/v4/module/seo-tools/active',
				method: 'POST',
				data: { active: true },
			} );
			// `use_beacon` makes w.js send with a keepalive fetch, which outlives the reload.
			recordSeoEvent( 'jetpack_seo_tools_toggled', screen, {
				enabled: true,
				use_beacon: true,
			} );
			window.location.reload();
		} catch {
			setIsEnabling( false );
			createErrorNotice( __( 'Could not enable SEO tools. Please try again.', 'jetpack-seo' ), {
				id: 'seo-tools-toggle',
				type: 'snackbar',
			} );
		}
	}, [ createErrorNotice, screen ] );

	return { isEnabling, enable };
}
