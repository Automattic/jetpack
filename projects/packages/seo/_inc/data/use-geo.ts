import apiFetch from '@wordpress/api-fetch';
import { select, useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { withCrawlerBlocked, withGroupBlocked } from './blocked-crawlers';
import { geoStore } from './geo-store';
import { recordSeoEvent } from './record-seo-event';
import type { AiCrawler, GeoState } from './geo-types';

// Single snackbar id reused across a save so "Updating settings…" is replaced
// in place by "Settings saved." (or an error) — matches the Settings tab.
const SAVE_NOTICE_ID = 'jetpack-seo-geo-save';

// WordPress core's settings endpoint. Every AI toggle is an option registered
// with `show_in_rest` server-side, so it round-trips through core REST — which
// exists on every platform the dashboard runs on.
const CORE_SETTINGS_PATH = '/wp/v2/settings';

export interface GeoForm {
	enhancer: GeoState[ 'enhancer' ] | null;
	llmsTxt: GeoState[ 'llmsTxt' ] | null;
	crawlers: GeoState[ 'crawlers' ] | null;
	isSaving: boolean;
	/** Toggle the AI SEO Enhancer and save immediately. */
	setEnhancerEnabled: ( next: boolean ) => void;
	/** Toggle llms.txt generation and save immediately. */
	setLlmsTxtEnabled: ( next: boolean ) => void;
	/** Allow or block a single AI crawler and save immediately. */
	setCrawlerBlocked: ( slug: string, blocked: boolean ) => void;
	/** Allow or block every AI crawler in a group in one save. */
	setCrawlerGroupBlocked: ( type: AiCrawler[ 'type' ], blocked: boolean ) => void;
}

/**
 * Owns the GEO tab's form state: seeds from the page bootstrap and auto-saves each
 * toggle through WordPress core's `/wp/v2/settings`. There's no Save button —
 * toggles save on change, surfacing the shared "Updating settings…"→"Settings
 * saved." snackbar. On failure the local value reverts.
 *
 * The GEO tab is its own route, so this controller remounts on every tab switch.
 * Each slice is seeded from (and written back to) [geo-store] rather than the
 * one-time bootstrap, so a saved toggle persists across route switches without a
 * reload.
 *
 * @return The GEO form controller.
 */
export function useGeoForm(): GeoForm {
	// Seed from the store (latest-saved snapshot), not the one-time bootstrap.
	const initialEnhancer = useMemo( () => select( geoStore ).getEnhancer(), [] );
	const initialLlmsTxt = useMemo( () => select( geoStore ).getLlmsTxt(), [] );
	const initialCrawlers = useMemo( () => select( geoStore ).getCrawlers(), [] );

	const [ enhancer, setEnhancer ] = useState< GeoState[ 'enhancer' ] | null >( initialEnhancer );
	const [ llmsTxt, setLlmsTxt ] = useState< GeoState[ 'llmsTxt' ] | null >( initialLlmsTxt );
	const [ crawlers, setCrawlers ] = useState< GeoState[ 'crawlers' ] | null >( initialCrawlers );
	const [ isSaving, setIsSaving ] = useState( false );

	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const {
		setEnhancer: persistEnhancer,
		setLlmsTxt: persistLlmsTxt,
		setCrawlers: persistCrawlers,
	} = useDispatch( geoStore );

	// Shared save lifecycle: optimistic snackbar, POST, then `onSuccess` (persist
	// the saved value to the store) or `onError` (revert the optimistic update).
	const runSave = useCallback(
		( data: Record< string, unknown >, onSuccess: () => void, onError: () => void ) => {
			setIsSaving( true );
			createInfoNotice( __( 'Updating settings…', 'jetpack-seo' ), {
				id: SAVE_NOTICE_ID,
				type: 'snackbar',
				isDismissible: false,
			} );
			apiFetch( { path: CORE_SETTINGS_PATH, method: 'POST', data } )
				.then( () => {
					onSuccess();
					createSuccessNotice( __( 'Settings saved.', 'jetpack-seo' ), {
						id: SAVE_NOTICE_ID,
						type: 'snackbar',
					} );
				} )
				.catch( ( error: { message?: string } ) => {
					onError();
					createErrorNotice(
						error?.message ?? __( 'Could not save settings. Please try again.', 'jetpack-seo' ),
						{ id: SAVE_NOTICE_ID, type: 'snackbar' }
					);
				} )
				.finally( () => setIsSaving( false ) );
		},
		[ createInfoNotice, createSuccessNotice, createErrorNotice ]
	);

	const setEnhancerEnabled = useCallback(
		( next: boolean ) => {
			setEnhancer( prev => ( prev ? { ...prev, enabled: next } : prev ) );
			runSave(
				{ ai_seo_enhancer_enabled: next },
				() => {
					if ( initialEnhancer ) {
						persistEnhancer( { ...initialEnhancer, enabled: next } );
					}
				},
				() => setEnhancer( prev => ( prev ? { ...prev, enabled: ! next } : prev ) )
			);
		},
		[ runSave, persistEnhancer, initialEnhancer ]
	);

	const setLlmsTxtEnabled = useCallback(
		( next: boolean ) => {
			setLlmsTxt( prev => ( prev ? { ...prev, enabled: next } : prev ) );
			runSave(
				{ jetpack_seo_llms_txt_enabled: next },
				() => {
					if ( initialLlmsTxt ) {
						persistLlmsTxt( { ...initialLlmsTxt, enabled: next } );
					}
					recordSeoEvent( 'jetpack_seo_llms_txt_enabled', 'geo', { enabled: next } );
				},
				() => setLlmsTxt( prev => ( prev ? { ...prev, enabled: ! next } : prev ) )
			);
		},
		[ runSave, persistLlmsTxt, initialLlmsTxt ]
	);

	const setCrawlerBlocked = useCallback(
		( slug: string, blocked: boolean ) => {
			if ( ! crawlers ) {
				return;
			}
			const nextBlocked = withCrawlerBlocked( crawlers.blocked, crawlers.catalog, slug, blocked );
			if ( nextBlocked === crawlers.blocked ) {
				return;
			}

			const prevCrawlers = crawlers;
			const nextCrawlers = { ...crawlers, blocked: nextBlocked };
			setCrawlers( nextCrawlers );
			runSave(
				{ jetpack_seo_blocked_crawlers: nextBlocked },
				() => {
					persistCrawlers( nextCrawlers );
					recordSeoEvent( 'jetpack_seo_bot_toggle_changed', 'geo', { bot: slug, blocked } );
				},
				() => setCrawlers( prevCrawlers )
			);
		},
		[ crawlers, runSave, persistCrawlers ]
	);

	const setCrawlerGroupBlocked = useCallback(
		( type: AiCrawler[ 'type' ], blocked: boolean ) => {
			if ( ! crawlers ) {
				return;
			}
			const nextBlocked = withGroupBlocked( crawlers.blocked, type, blocked );

			const prevCrawlers = crawlers;
			const nextCrawlers = { ...crawlers, blocked: nextBlocked };
			setCrawlers( nextCrawlers );
			runSave(
				{ jetpack_seo_blocked_crawlers: nextBlocked },
				() => {
					persistCrawlers( nextCrawlers );
					recordSeoEvent( 'jetpack_seo_bot_toggle_changed', 'geo', {
						bot: `group:${ type }`,
						blocked,
					} );
				},
				() => setCrawlers( prevCrawlers )
			);
		},
		[ crawlers, runSave, persistCrawlers ]
	);

	return {
		enhancer,
		llmsTxt,
		crawlers,
		isSaving,
		setEnhancerEnabled,
		setLlmsTxtEnabled,
		setCrawlerBlocked,
		setCrawlerGroupBlocked,
	};
}
