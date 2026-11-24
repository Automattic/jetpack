import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import {
	CONTENT_PATH,
	forgetPreloaded,
	GEO_PATH,
	OVERVIEW_PATH,
	writePreloaded,
} from './get-preloaded';
import { recordSeoEvent } from './record-seo-event';
import { settingsStore } from './settings-store';
import type { SeoTracksScreen } from './record-seo-event';

// Pre-resolved: the production minifier folds `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which breaks i18n extraction.
const enableErrorMessage = __( 'Could not enable SEO tools. Please try again.', 'jetpack-seo' );
const disableErrorMessage = __( 'Could not disable SEO tools. Please try again.', 'jetpack-seo' );

const NOTICE_ID = 'seo-tools-toggle';

// Cap on the Overview re-read, as on the Settings form's: a hung request must not keep the switch locked.
const REFRESH_TIMEOUT_MS = 10000;

interface SeoToolsSwitch {
	/** The state being saved, or null while no save is in flight. */
	pending: boolean | null;
	/** Whether the request is in flight. */
	isSwitching: boolean;
	/** Switch the `seo-tools` module on or off. */
	setActive: ( active: boolean ) => Promise< void >;
}

/**
 * Re-read the Overview, whose figures follow SEO tools. A failure keeps the old
 * figures until the next page load.
 *
 * @return Resolves once the Overview is replaced, fails, or times out.
 */
async function refreshOverview(): Promise< void > {
	let timer: ReturnType< typeof setTimeout > | undefined;
	try {
		await Promise.race( [
			apiFetch( { path: OVERVIEW_PATH } ).then( body => writePreloaded( OVERVIEW_PATH, body ) ),
			new Promise< void >( resolve => {
				timer = setTimeout( resolve, REFRESH_TIMEOUT_MS );
			} ),
		] );
	} catch {
		// Nothing to undo: the switch itself saved.
	} finally {
		clearTimeout( timer );
	}
}

/**
 * Switch the `seo-tools` module from the SEO page, through the same route as the
 * other module-backed settings, and refresh the tabs that depend on it in place.
 *
 * @param screen - The screen the control was used from, for Tracks.
 * @return The switch controller.
 */
export default function useSeoToolsSwitch( screen: SeoTracksScreen ): SeoToolsSwitch {
	const [ pending, setPending ] = useState< boolean | null >( null );
	const { createErrorNotice, createInfoNotice, createSuccessNotice } = useDispatch( noticesStore );
	const { setSeoToolsActive } = useDispatch( settingsStore );

	const setActive = useCallback(
		async ( active: boolean ) => {
			setPending( active );
			createInfoNotice( __( 'Updating settings…', 'jetpack-seo' ), {
				id: NOTICE_ID,
				type: 'snackbar',
				isDismissible: false,
			} );
			try {
				await apiFetch( {
					path: '/jetpack/v4/seo/modules',
					method: 'POST',
					data: { seo_tools_active: active },
				} );
			} catch {
				setPending( null );
				createErrorNotice( active ? enableErrorMessage : disableErrorMessage, {
					id: NOTICE_ID,
					type: 'snackbar',
				} );
				return;
			}

			recordSeoEvent( 'jetpack_seo_tools_toggled', screen, { enabled: active } );
			// GEO and Content fetch again on their next visit. Settings needs the Overview, so it is replaced in place.
			forgetPreloaded( GEO_PATH );
			forgetPreloaded( CONTENT_PATH );
			await refreshOverview();
			// Last, so the tabs appear with the fresh Overview behind them.
			setSeoToolsActive( active );
			setPending( null );
			createSuccessNotice( __( 'Settings saved.', 'jetpack-seo' ), {
				id: NOTICE_ID,
				type: 'snackbar',
			} );
		},
		[ createErrorNotice, createInfoNotice, createSuccessNotice, setSeoToolsActive, screen ]
	);

	return { pending, isSwitching: pending !== null, setActive };
}
