import apiFetch from '@wordpress/api-fetch';
import { select, useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { aiStore } from './ai-store';
import type { AiCrawler, AiState } from './ai-types';

// Single snackbar id reused across a save so "Updating settings…" is replaced
// in place by "Settings saved." (or an error) — matches the Settings tab.
const SAVE_NOTICE_ID = 'jetpack-seo-ai-save';

export interface AiForm {
	enhancer: AiState[ 'enhancer' ] | null;
	llmsTxt: AiState[ 'llmsTxt' ] | null;
	crawlers: AiState[ 'crawlers' ] | null;
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
 * Owns the AI tab's form state: seeds from the page bootstrap and auto-saves each
 * toggle through `/jetpack/v4/settings` (the same endpoint the legacy Traffic
 * page used). There's no Save button — toggles save on change, surfacing the
 * shared "Updating settings…"→"Settings saved." snackbar. On failure the local
 * value reverts.
 *
 * The AI tab is its own route, so this controller remounts on every tab switch.
 * Each slice is seeded from (and written back to) [ai-store] rather than the
 * one-time bootstrap, so a saved toggle persists across route switches without a
 * reload.
 *
 * @return The AI form controller.
 */
export function useAiForm(): AiForm {
	// Seed from the store (latest-saved snapshot), not the one-time bootstrap.
	const initialEnhancer = useMemo( () => select( aiStore ).getEnhancer(), [] );
	const initialLlmsTxt = useMemo( () => select( aiStore ).getLlmsTxt(), [] );
	const initialCrawlers = useMemo( () => select( aiStore ).getCrawlers(), [] );

	const [ enhancer, setEnhancer ] = useState< AiState[ 'enhancer' ] | null >( initialEnhancer );
	const [ llmsTxt, setLlmsTxt ] = useState< AiState[ 'llmsTxt' ] | null >( initialLlmsTxt );
	const [ crawlers, setCrawlers ] = useState< AiState[ 'crawlers' ] | null >( initialCrawlers );
	const [ isSaving, setIsSaving ] = useState( false );

	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const {
		setEnhancer: persistEnhancer,
		setLlmsTxt: persistLlmsTxt,
		setCrawlers: persistCrawlers,
	} = useDispatch( aiStore );

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
			apiFetch( { path: '/jetpack/v4/settings', method: 'POST', data } )
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
			// The default policy for this bot: training crawlers blocked, answer-engine
			// crawlers allowed. An override that matches the default is dropped so the
			// stored map stays sparse (and new training bots stay covered).
			const bot = crawlers.catalog.find( entry => entry.slug === slug );
			const defaultBlocked = bot ? bot.type === 'training' : false;

			const nextOverrides = { ...crawlers.overrides };
			if ( blocked === defaultBlocked ) {
				delete nextOverrides[ slug ];
			} else {
				nextOverrides[ slug ] = blocked;
			}

			const prevCrawlers = crawlers;
			const nextCrawlers = { ...crawlers, overrides: nextOverrides };
			setCrawlers( nextCrawlers );
			runSave(
				{ jetpack_seo_ai_crawler_overrides: nextOverrides },
				() => persistCrawlers( nextCrawlers ),
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
			// Every bot in a group shares one default policy (training → blocked,
			// otherwise allowed), so an override matching that default is dropped to
			// keep the stored map sparse — same rule as the single-crawler setter.
			const defaultBlocked = type === 'training';
			const nextOverrides = { ...crawlers.overrides };
			crawlers.catalog
				.filter( bot => bot.type === type )
				.forEach( bot => {
					if ( blocked === defaultBlocked ) {
						delete nextOverrides[ bot.slug ];
					} else {
						nextOverrides[ bot.slug ] = blocked;
					}
				} );

			const prevCrawlers = crawlers;
			const nextCrawlers = { ...crawlers, overrides: nextOverrides };
			setCrawlers( nextCrawlers );
			runSave(
				{ jetpack_seo_ai_crawler_overrides: nextOverrides },
				() => persistCrawlers( nextCrawlers ),
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
