import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button, ToggleControl } from '@wordpress/components';
import { createInterpolateElement, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { useDataSyncEntry } from '../lib/use-data-sync-entry';
import {
	useClearPageCache,
	usePageCacheError,
	usePageCacheSettings,
	useRunPageCacheSetup,
} from '../lib/use-page-cache';
import type { useModulesState } from '../lib/use-modules-state';
import { usePremiumFeatures } from '../lib/use-premium-features';
import { z } from 'zod';
import CriticalCssStatus from './critical-css-status';
import ModuleRow from './module-row';
import ModuleSubrow from './module-subrow';
import SectionCard from './section-card';
import UpgradeCTA from './upgrade-cta';

/**
 * Hash-route to the cache debug log sub-page on the legacy chassis.
 * Stays reachable by toggling the modernization filter off until
 * PR 4 wires the route into the new chassis as part of the
 * flag-flip.
 */
const CACHE_DEBUG_LOG_URL = 'admin.php?page=jetpack-boost#/cache-debug-log';

const excludesSchema = z.array( z.string() );

type Props = {
	modulesState: ReturnType< typeof useModulesState >[ 'data' ];
	isLoading: boolean;
};

/**
 * Code loading optimization section. Renders the CSS module
 * (manual or auto, whichever is available), Cache site pages,
 * Defer Non-Essential JavaScript, and the Concatenate JS / CSS
 * modules with their Exclude-handles subrows.
 *
 * @param props              - See `Props`.
 * @param props.modulesState
 * @param props.isLoading
 * @return The Code loading section card.
 */
export default function CodeLoadingSection( { modulesState, isLoading }: Props ): JSX.Element {
	const premium = usePremiumFeatures();
	const criticalLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );

	// The design's CSS label always reads "Automatically Optimize CSS Loading" —
	// when only manual mode is available, we still surface that label and rely on
	// the manual → auto upsell Notice (rendered via `persistent`) to set the
	// expectation. The underlying toggle drives whichever module is `available`.
	const cloudAvailable = modulesState?.cloud_css?.available !== false && !! modulesState?.cloud_css;
	const cssSlug = cloudAvailable ? 'cloud_css' : 'critical_css';
	const cssModuleState = modulesState?.[ cssSlug ];
	const cssDescription = createInterpolateElement(
		__(
			"Move important styling information to the start of the page, which helps pages display your content sooner, so your users don't have to wait for the entire page to load. Also known as <link>Critical CSS</link>.",
			'jetpack-boost'
		),
		{ link: <Link openInNewTab href={ criticalLink } /> }
	);

	return (
		<SectionCard title={ __( 'Code loading optimization', 'jetpack-boost' ) }>
			{ cssModuleState?.available !== false && (
				<ModuleRow
					slug={ cssSlug }
					state={ cssModuleState }
					isLoading={ isLoading }
					label={ __( 'Automatically Optimize CSS Loading', 'jetpack-boost' ) }
					description={ cssDescription }
					persistent={
						! premium.has( 'cloud-critical-css' ) && cssSlug === 'critical_css' ? (
							<UpgradeCTA
								identifier="cloud-critical-css"
								description={ __(
									'Save time and skip the manual regenerate — upgrade to let Boost regenerate Critical CSS for you whenever the site changes.',
									'jetpack-boost'
								) }
							/>
						) : null
					}
				>
					<CriticalCssStatus mode={ cssSlug === 'cloud_css' ? 'auto' : 'manual' } />
				</ModuleRow>
			) }

			<PageCacheRow modulesState={ modulesState } isLoading={ isLoading } />

			<ModuleRow
				slug="render_blocking_js"
				state={ modulesState?.render_blocking_js }
				isLoading={ isLoading }
				label={ __( 'Defer Non-Essential JavaScript', 'jetpack-boost' ) }
				description={ createInterpolateElement(
					__(
						'Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly. Read more on <link>web.dev</link>.',
						'jetpack-boost'
					),
					{ link: <Link openInNewTab href={ deferJsLink } /> }
				) }
			/>

			<MinifyRow
				slug="minify_js"
				entryKey="minify_js_excludes"
				state={ modulesState?.minify_js }
				isLoading={ isLoading }
				label={ __( 'Concatenate JS', 'jetpack-boost' ) }
				description={ __(
					'Concatenated and minified scripts to reduce site loading time and reduce the number of requests.',
					'jetpack-boost'
				) }
				subrowAction={ __( 'Exclude JS handles', 'jetpack-boost' ) }
			/>

			<MinifyRow
				slug="minify_css"
				entryKey="minify_css_excludes"
				state={ modulesState?.minify_css }
				isLoading={ isLoading }
				label={ __( 'Concatenate CSS', 'jetpack-boost' ) }
				description={ __(
					'Concatenated and minified styles to reduce site loading time and reduce the number of requests.',
					'jetpack-boost'
				) }
				subrowAction={ __( 'Exclude CSS handles', 'jetpack-boost' ) }
			/>
		</SectionCard>
	);
}

type PageCacheRowProps = {
	modulesState: ReturnType< typeof useModulesState >[ 'data' ];
	isLoading: boolean;
};

/**
 * Cache site pages row + Advanced subrow. The advanced controls
 * (bypass patterns, logging, clear cache, see logs) are tucked into
 * a single "Advanced" subrow per the new IA — the design surfaces
 * just the toggle, but the legacy functionality stays one click
 * away.
 * @param root0
 * @param root0.modulesState
 * @param root0.isLoading
 */
function PageCacheRow( { modulesState, isLoading }: PageCacheRowProps ): JSX.Element {
	const [ settingsQuery, settingsMutation ] = usePageCacheSettings();
	const [ errorQuery, errorMutation ] = usePageCacheError();
	const setupAction = useRunPageCacheSetup();
	const clearAction = useClearPageCache();

	const saved = settingsQuery.data;
	const error = errorQuery.data;
	const showError = !! error && ! error.dismissed;

	const [ draftPatterns, setDraftPatterns ] = useState( '' );
	const savedJoined = ( saved?.bypass_patterns ?? [] ).join( '\n' );
	useEffect( () => {
		setDraftPatterns( current =>
			current === '' || current === savedJoined ? savedJoined : current
		);
	}, [ savedJoined ] );

	const onSavePatterns = () => {
		if ( ! saved ) {
			return;
		}
		const next = draftPatterns
			.split( '\n' )
			.map( line => line.trim() )
			.filter( Boolean );
		settingsMutation.mutate( { ...saved, bypass_patterns: next } );
	};
	const onToggleLogging = () => {
		if ( saved ) {
			settingsMutation.mutate( { ...saved, logging: ! saved.logging } );
		}
	};
	const onClearCache = () => clearAction.mutate( undefined as never );
	const onRetrySetup = () => setupAction.mutate( undefined as never );
	const onDismissError = () => {
		if ( error ) {
			errorMutation.mutate( { ...error, dismissed: true } );
		}
	};

	const isDirty = draftPatterns !== savedJoined;
	const bypassCount = saved?.bypass_patterns?.length ?? 0;
	const advancedSummary = bypassCount
		? sprintf(
				/* translators: %d is the number of bypass patterns currently set. */
				__( '%d bypass pattern(s) active', 'jetpack-boost' ),
				bypassCount
		  )
		: __( 'No bypass patterns', 'jetpack-boost' );

	return (
		<ModuleRow
			slug="page_cache"
			state={ modulesState?.page_cache }
			isLoading={ isLoading }
			label={ __( 'Cache site pages', 'jetpack-boost' ) }
			description={ __(
				'Store and serve preloaded content to reduce load times and enhance your site performance and user experience.',
				'jetpack-boost'
			) }
			persistent={
				showError && error ? (
					<div className="jetpack-boost-page-cache__error">
						<strong>{ error.message }</strong>
						<Button variant="link" onClick={ onRetrySetup } isBusy={ setupAction.isPending }>
							{ __( 'Retry setup', 'jetpack-boost' ) }
						</Button>
						<Button variant="link" onClick={ onDismissError }>
							{ __( 'Dismiss', 'jetpack-boost' ) }
						</Button>
					</div>
				) : null
			}
		>
			<ModuleSubrow summary={ advancedSummary } actionLabel={ __( 'Advanced', 'jetpack-boost' ) }>
				<div className="jetpack-boost-inline-editor">
					<label
						className="jetpack-boost-inline-editor__label"
						htmlFor="jetpack-boost-page-cache-patterns"
					>
						<strong>{ __( 'Bypass patterns', 'jetpack-boost' ) }</strong>
					</label>
					<textarea
						id="jetpack-boost-page-cache-patterns"
						className="jetpack-boost-inline-editor__textarea"
						rows={ 4 }
						value={ draftPatterns }
						onChange={ e => setDraftPatterns( e.target.value ) }
						placeholder={ __( 'One regex pattern per line', 'jetpack-boost' ) }
					/>
					<p className="jetpack-boost-inline-editor__helper">
						{ __( 'Pages matching any of these patterns will skip the cache.', 'jetpack-boost' ) }
					</p>
					<div className="jetpack-boost-inline-editor__actions">
						<Button
							variant="primary"
							disabled={ ! isDirty || settingsMutation.isPending }
							isBusy={ settingsMutation.isPending }
							onClick={ onSavePatterns }
						>
							{ __( 'Save patterns', 'jetpack-boost' ) }
						</Button>
						<Button variant="secondary" isBusy={ clearAction.isPending } onClick={ onClearCache }>
							{ __( 'Clear cache', 'jetpack-boost' ) }
						</Button>
						<Button variant="link" href={ CACHE_DEBUG_LOG_URL }>
							{ __( 'See logs', 'jetpack-boost' ) }
						</Button>
					</div>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Log page cache hits and misses', 'jetpack-boost' ) }
						help={ __(
							'Keep a running log of cache behavior — useful for debugging slow pages.',
							'jetpack-boost'
						) }
						checked={ saved?.logging ?? false }
						disabled={ ! saved || settingsMutation.isPending }
						onChange={ onToggleLogging }
					/>
				</div>
			</ModuleSubrow>
		</ModuleRow>
	);
}

type MinifyRowProps = {
	slug: 'minify_js' | 'minify_css';
	entryKey: 'minify_js_excludes' | 'minify_css_excludes';
	state: ReturnType< typeof useModulesState >[ 'data' ] extends infer T
		? T extends Record< string, infer V >
			? V
			: never
		: never;
	isLoading: boolean;
	label: string;
	description: string;
	subrowAction: string;
};

/**
 * Reusable Minify JS / Minify CSS row. Renders the toggle row plus
 * an Exclude-handles subrow. The subrow's summary is the current
 * exclusion list ("Except: jquery, jquery-core, …") and clicking
 * the action label expands an inline editor with the input + Save +
 * Load default handles.
 * @param root0
 * @param root0.slug
 * @param root0.entryKey
 * @param root0.state
 * @param root0.isLoading
 * @param root0.label
 * @param root0.description
 * @param root0.subrowAction
 */
function MinifyRow( {
	slug,
	entryKey,
	state,
	isLoading,
	label,
	description,
	subrowAction,
}: MinifyRowProps ): JSX.Element {
	const [ excludesQuery, excludesMutation ] = useDataSyncEntry( entryKey, excludesSchema );
	const defaultsKey =
		entryKey === 'minify_js_excludes'
			? 'minify_js_excludes_default'
			: 'minify_css_excludes_default';
	const [ defaultsQuery ] = useDataSyncEntry( defaultsKey, excludesSchema, {
		staleTime: 60 * 60 * 1000,
	} );

	const saved = excludesQuery.data ?? [];
	const savedJoined = saved.join( ', ' );
	const [ draft, setDraft ] = useState( '' );
	useEffect( () => {
		setDraft( current => ( current === '' || current === savedJoined ? savedJoined : current ) );
	}, [ savedJoined ] );

	const onSave = () => {
		const handles = draft
			.split( ',' )
			.map( h => h.trim() )
			.filter( Boolean );
		excludesMutation.mutate( handles );
	};
	const onLoadDefaults = () => {
		const defaults = defaultsQuery.data ?? [];
		if ( defaults.length === 0 ) {
			return;
		}
		const next = Array.from( new Set( [ ...saved, ...defaults ] ) );
		excludesMutation.mutate( next );
		setDraft( next.join( ', ' ) );
	};

	const isDirty = draft !== savedJoined;
	const subrowSummary =
		saved.length === 0
			? __( 'No exceptions', 'jetpack-boost' )
			: sprintf(
					/* translators: %s is a comma-separated list of handles. */
					__( 'Except: %s', 'jetpack-boost' ),
					saved.join( ', ' )
			  );

	return (
		<ModuleRow
			slug={ slug }
			state={ state }
			isLoading={ isLoading }
			label={ label }
			description={ description }
		>
			<ModuleSubrow summary={ subrowSummary } actionLabel={ subrowAction }>
				<div className="jetpack-boost-inline-editor">
					<label
						className="jetpack-boost-inline-editor__label"
						htmlFor={ `jetpack-boost-${ entryKey }` }
					>
						<strong>{ subrowAction }</strong>
					</label>
					<input
						id={ `jetpack-boost-${ entryKey }` }
						className="jetpack-boost-inline-editor__input"
						type="text"
						value={ draft }
						placeholder={ __( 'Comma-separated list of handles to exclude', 'jetpack-boost' ) }
						onChange={ e => setDraft( e.target.value ) }
					/>
					<p className="jetpack-boost-inline-editor__helper">
						{ __( 'Use a comma (,) to separate handles.', 'jetpack-boost' ) }
					</p>
					<div className="jetpack-boost-inline-editor__actions">
						<Button
							variant="primary"
							disabled={ ! isDirty || excludesMutation.isPending }
							isBusy={ excludesMutation.isPending }
							onClick={ onSave }
						>
							{ __( 'Save', 'jetpack-boost' ) }
						</Button>
						<Button
							variant="link"
							disabled={ ! defaultsQuery.data || excludesMutation.isPending }
							onClick={ onLoadDefaults }
						>
							{ __( 'Load default handles', 'jetpack-boost' ) }
						</Button>
					</div>
				</div>
			</ModuleSubrow>
		</ModuleRow>
	);
}
