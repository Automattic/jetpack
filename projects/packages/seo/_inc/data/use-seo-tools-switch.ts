import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { recordSeoEvent } from './record-seo-event';
import type { SeoTracksScreen } from './record-seo-event';

// Pre-resolved: the production minifier folds `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which breaks i18n extraction.
const enableErrorMessage = __( 'Could not enable SEO tools. Please try again.', 'jetpack-seo' );
const disableErrorMessage = __( 'Could not disable SEO tools. Please try again.', 'jetpack-seo' );

interface SeoToolsSwitch {
	/** Whether the request is in flight. */
	isSwitching: boolean;
	/** Switch the `seo-tools` module on or off, then reload. */
	setActive: ( active: boolean ) => Promise< void >;
}

/**
 * Switch the `seo-tools` module from the SEO page.
 * Reloads on success to load or drop the module-dependent output and editing controls.
 * A snackbar would not survive that, so only failure shows a notice.
 *
 * @param screen - The screen the control was used from, for Tracks.
 * @return The switch controller.
 */
export default function useSeoToolsSwitch( screen: SeoTracksScreen ): SeoToolsSwitch {
	const [ isSwitching, setIsSwitching ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );

	const setActive = useCallback(
		async ( active: boolean ) => {
			setIsSwitching( true );
			try {
				await apiFetch( {
					path: '/jetpack/v4/module/seo-tools/active',
					method: 'POST',
					data: { active },
				} );
				// `use_beacon` makes w.js send with a keepalive fetch, which outlives the reload.
				recordSeoEvent( 'jetpack_seo_tools_toggled', screen, {
					enabled: active,
					use_beacon: true,
				} );
				window.location.reload();
			} catch {
				setIsSwitching( false );
				createErrorNotice( active ? enableErrorMessage : disableErrorMessage, {
					id: 'seo-tools-toggle',
					type: 'snackbar',
				} );
			}
		},
		[ createErrorNotice, screen ]
	);

	return { isSwitching, setActive };
}
