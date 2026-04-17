/* eslint-disable jsdoc/require-returns */

/* eslint-disable react/jsx-no-bind */

import { Button, Notice, Spinner, TextareaControl, ToggleControl } from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { useBlocker } from 'react-router';
import { useSeoSettings, useUpdateSeoSettings } from '../../data/use-settings';
import { useSetHeaderActions } from '../../header-actions-context';
import AiCrawlersCard from '../discoverability/ai-crawlers-card';
import LlmsTxtCard from '../discoverability/llms-txt-card';
import SitemapCard from '../sitemap/sitemap-card';
import styles from './style.module.scss';
import TitleStructureField from './title-structure-field';
import VerificationCard from './verification-card';
import type {
	SettingsResponse,
	TitleFormatToken,
	VerificationKey,
} from '../../data/settings-types';
import type { FC } from 'react';

/**
 * Consolidated Settings screen.
 *
 * Everything that isn't per-post lives here. The Save button is hoisted into
 * the AdminPage header via HeaderActionsContext — disabled by default,
 * enabled only when the local form state diverges from the last server
 * response.
 */
const SettingsScreen: FC = () => {
	const { data, isLoading, isError, error } = useSeoSettings();
	const mutation = useUpdateSeoSettings();
	const [ local, setLocal ] = useState< SettingsResponse | null >( null );
	const setHeaderActions = useSetHeaderActions();

	useEffect( () => {
		if ( data ) {
			setLocal( data );
		}
	}, [ data ] );

	// Cheap structural equality — the settings payload is small enough that
	// JSON.stringify is fine, and it sidesteps pulling in a deep-equal util.
	const isDirty = useMemo( () => {
		if ( ! data || ! local ) {
			return false;
		}
		return JSON.stringify( data ) !== JSON.stringify( local );
	}, [ data, local ] );

	const save = () => {
		if ( ! local ) {
			return;
		}
		mutation.mutate( {
			front_page_description: local.front_page_description,
			title_formats: local.title_formats,
			verification: local.verification,
			canonical_urls_enabled: local.canonical_urls_enabled,
		} );
	};

	// Inject the Save button into the AdminPage header slot. Rerun whenever
	// dirtiness or pending state changes so the button's disabled/isBusy
	// props stay in sync. `size="compact"` keeps it visually lightweight in
	// the header row.
	useEffect( () => {
		setHeaderActions(
			<Button
				variant="primary"
				size="compact"
				onClick={ save }
				disabled={ ! isDirty || mutation.isPending }
				isBusy={ mutation.isPending }
			>
				{ __( 'Save', 'jetpack-seo' ) }
			</Button>
		);
		return () => setHeaderActions( null );
		// `save` closes over `local` and `mutation`; those drive the deps.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ setHeaderActions, isDirty, mutation.isPending, local ] );

	// Guard in-app navigation (e.g. clicking the Overview/Content tabs) when
	// the form has unsaved changes. react-router's `useBlocker` pauses the
	// transition and hands us a blocker object; we fall back to the native
	// confirm dialog to ask the user whether to discard changes.
	const blocker = useBlocker(
		( { currentLocation, nextLocation } ) =>
			isDirty && currentLocation.pathname !== nextLocation.pathname
	);

	useEffect( () => {
		if ( blocker.state !== 'blocked' ) {
			return;
		}
		// eslint-disable-next-line no-alert
		const proceed = window.confirm(
			__(
				'You have unsaved SEO settings. Leave this page and discard your changes?',
				'jetpack-seo'
			)
		);
		if ( proceed ) {
			blocker.proceed();
		} else {
			blocker.reset();
		}
	}, [ blocker ] );

	// Guard full-page exit (tab close, back button, link outside the SPA).
	// The browser renders its own standard confirmation when
	// `beforeunload.preventDefault()` is called and `returnValue` is set.
	useEffect( () => {
		if ( ! isDirty ) {
			return;
		}
		const handler = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', handler );
		return () => window.removeEventListener( 'beforeunload', handler );
	}, [ isDirty ] );

	if ( isLoading || ! data || ! local ) {
		return (
			<div className={ styles.page }>
				<Spinner />
			</div>
		);
	}
	if ( isError ) {
		return (
			<div className={ styles.page }>
				<Notice status="error" isDismissible={ false }>
					{ error?.message ?? __( 'Unable to load settings.', 'jetpack-seo' ) }
				</Notice>
			</div>
		);
	}

	const setDescription = ( next: string ) =>
		setLocal( state => ( state ? { ...state, front_page_description: next } : state ) );

	const setTitleTokens = ( next: TitleFormatToken[] ) =>
		setLocal( state =>
			state
				? {
						...state,
						title_formats: { ...state.title_formats, posts: next },
				  }
				: state
		);

	const setVerification = ( key: VerificationKey, value: string ) =>
		setLocal( state =>
			state ? { ...state, verification: { ...state.verification, [ key ]: value } } : state
		);

	const setCanonicalUrls = ( next: boolean ) =>
		setLocal( state => ( state ? { ...state, canonical_urls_enabled: next } : state ) );

	const postsTokens = local.title_formats.posts ?? [];

	// Card order follows user intent:
	//   1. Title structure        — affects every page, highest-impact knob
	//   2. Front-page description  — home-page-specific meta
	//   3. Sitemap                — make sure search engines can find content
	//   4. Canonical URLs         — prevent duplicate content on archive pages
	//   5. llms.txt               — AI-agent discoverability
	//   6. AI crawlers            — block/allow LLM crawlers
	//   7. Site verification      — connect to search consoles last
	return (
		<div className={ styles.page }>
			<TitleStructureField
				tokens={ postsTokens }
				onChange={ setTitleTokens }
				disabled={ mutation.isPending }
			/>

			<CollapsibleCard.Root defaultOpen={ false }>
				<CollapsibleCard.Header>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Card.Title>{ __( 'Front-page description', 'jetpack-seo' ) }</Card.Title>
						<Badge intent={ local.front_page_description ? 'stable' : 'draft' }>
							{ local.front_page_description
								? __( 'Set', 'jetpack-seo' )
								: __( 'Not set', 'jetpack-seo' ) }
						</Badge>
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<TextareaControl
						label={ __( 'Meta description shown on the home page', 'jetpack-seo' ) }
						value={ local.front_page_description }
						onChange={ setDescription }
						rows={ 3 }
						__nextHasNoMarginBottom
					/>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>

			<SitemapCard />

			<CollapsibleCard.Root defaultOpen={ false }>
				<CollapsibleCard.Header>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Card.Title>{ __( 'Canonical URLs', 'jetpack-seo' ) }</Card.Title>
						<Badge intent={ local.canonical_urls_enabled ? 'stable' : 'draft' }>
							{ local.canonical_urls_enabled
								? __( 'Active', 'jetpack-seo' )
								: __( 'Inactive', 'jetpack-seo' ) }
						</Badge>
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<ToggleControl
						label={ __( 'Add canonical URL tags to archive pages', 'jetpack-seo' ) }
						help={ __(
							'Prevents duplicate content in search engines when the same content is reachable from multiple URLs (e.g. category, tag, and date archives).',
							'jetpack-seo'
						) }
						checked={ local.canonical_urls_enabled }
						onChange={ setCanonicalUrls }
						disabled={ mutation.isPending }
						__nextHasNoMarginBottom
					/>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>

			<LlmsTxtCard />
			<AiCrawlersCard />

			<VerificationCard
				value={ local.verification }
				onChange={ setVerification }
				disabled={ mutation.isPending }
			/>
		</div>
	);
};

export default SettingsScreen;
