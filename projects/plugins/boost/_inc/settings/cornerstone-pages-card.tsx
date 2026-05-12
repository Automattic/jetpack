import { useQueryClient } from '@tanstack/react-query';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button, Spinner, ToggleControl } from '@wordpress/components';
import { createInterpolateElement, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Card, CollapsibleCard, Link } from '@wordpress/ui';
import {
	useCornerstonePagesList,
	useCornerstonePagesProperties,
	useSetCornerstonePagesList,
} from '../lib/use-cornerstone-pages';
import { useModulesState, useSetModuleState } from '../lib/use-modules-state';
import { useRegenerateCriticalCss } from '../lib/use-critical-css-state';
import { usePremiumFeatures } from '../lib/use-premium-features';
import UpgradeCTA from './upgrade-cta';
import './cornerstone-pages-card.scss';

declare global {
	const Jetpack_Boost: { site: { url: string; online?: boolean } };
}

function parseTextareaToList( raw: string ): string[] {
	return raw
		.split( '\n' )
		.map( line => line.trim() )
		.filter( Boolean );
}

/**
 * Validate the textarea input against the legacy URL rules:
 *
 * - Each non-empty line must be a URL whose origin matches the
 *   Boost-localized site URL.
 * - The homepage path can't be added explicitly — it's already
 *   covered by the predefined list.
 * - The total line count must not exceed the plan's `max_pages`.
 *
 * Returns an error message on failure, `null` on success.
 *
 * @param raw      - Textarea value.
 * @param maxItems - Plan's max custom page count.
 * @return Error message string or null.
 */
function validateInput( raw: string, maxItems: number ): string | null {
	const lines = parseTextareaToList( raw );
	if ( lines.length === 0 ) {
		return null;
	}
	if ( lines.length > maxItems ) {
		return sprintf(
			/* translators: %d is the maximum allowed number of cornerstone page URLs. */
			_n(
				'You can add only %d cornerstone page URL on this plan.',
				'You can add up to %d cornerstone page URLs on this plan.',
				maxItems,
				'jetpack-boost'
			),
			maxItems
		);
	}
	const siteUrl = new URL( Jetpack_Boost.site.url );
	for ( const line of lines ) {
		let parsed: URL | null = null;
		try {
			parsed = new URL( line );
		} catch {
			// Relative URL → treat as same-site, fine.
		}
		if ( parsed && parsed.origin !== siteUrl.origin ) {
			return sprintf(
				/* translators: %s is the offending URL the user pasted. */
				__( 'This URL is on a different site: %s', 'jetpack-boost' ),
				line
			);
		}
		const path = parsed?.pathname ?? line;
		const isRootPath = path === '/' || path === siteUrl.pathname;
		if ( parsed && isRootPath && ! parsed.search ) {
			return __(
				"The homepage doesn't need to be added — it's included automatically.",
				'jetpack-boost'
			);
		}
	}
	return null;
}

/**
 * Cornerstone Pages settings card. Collapsible so it doesn't dominate
 * the Settings list. Surfaces the legacy editor's full feature set:
 * URL textarea with plan-aware validation, "Include default pages"
 * action that hydrates from the server's curated `default_pages` list
 * (plan-aware truncation), Save button (enabled only when dirty +
 * valid), Prerender Cornerstone Pages toggle, and a free-plan upgrade
 * Notice that funnels into My Jetpack's Boost add-on flow.
 *
 * Side effects on save mirror legacy behavior: invalidate the
 * Critical CSS state query so the Status card flips into `pending`,
 * fire a Cloud CSS regenerate when applicable, and invalidate LCP
 * state so the LCP card re-runs after the page list changes.
 *
 * @return The Cornerstone Pages card element.
 */
export default function CornerstonePagesCard(): JSX.Element {
	const supportLink = getRedirectUrl( 'jetpack-boost-cornerstone-pages' );
	const listQuery = useCornerstonePagesList();
	const propertiesQuery = useCornerstonePagesProperties();
	const setListMutation = useSetCornerstonePagesList();
	const modulesQuery = useModulesState();
	const [ setModuleState, moduleMutation ] = useSetModuleState();
	const regenerateCss = useRegenerateCriticalCss();
	const premium = usePremiumFeatures();
	const client = useQueryClient();

	const savedList = useMemo( () => listQuery.data ?? [], [ listQuery.data ] );
	const properties = propertiesQuery.data ?? null;
	const isPremium = premium.has( 'cornerstone-10-pages' );
	const maxItems = isPremium ? properties?.max_pages_premium ?? 10 : properties?.max_pages ?? 1;

	const [ draft, setDraft ] = useState( '' );

	const savedJoined = savedList.join( '\n' );
	useEffect( () => {
		setDraft( current => ( current === '' || current === savedJoined ? savedJoined : current ) );
	}, [ savedJoined ] );

	const validationError = useMemo( () => validateInput( draft, maxItems ), [ draft, maxItems ] );

	const summary = useMemo( () => {
		const count = savedList.length;
		if ( count === 0 ) {
			return __( 'Added: Homepage', 'jetpack-boost' );
		}
		return sprintf(
			/* translators: %d is the number of custom cornerstone pages. */
			_n( 'Added: Homepage + %d page', 'Added: Homepage + %d pages', count, 'jetpack-boost' ),
			count
		);
	}, [ savedList ] );

	const isDirty = draft !== savedJoined;
	const isSaving = setListMutation.isPending;
	const speculation = modulesQuery.data?.speculation_rules;
	const isSpeculationAvailable = speculation?.available ?? false;
	const isPrerenderOn = speculation?.active ?? false;
	const isPrerenderBusy = modulesQuery.isLoading || moduleMutation.isPending;

	const cloudCssState = modulesQuery.data?.cloud_css;
	const isCloudCssActive = cloudCssState?.active ?? false;

	const onSave = () => {
		const next = parseTextareaToList( draft );
		setListMutation.mutate( next, {
			onSuccess: () => {
				// Match legacy side effects: regenerate Cloud CSS if it
				// owns the Critical CSS generation, and invalidate the
				// LCP state so the LCP card re-runs against the new
				// cornerstone page list.
				if ( isCloudCssActive ) {
					regenerateCss.mutate( undefined as never );
				}
				client.invalidateQueries( {
					queryKey: [ 'jetpack_boost_ds', 'lcp_state' ],
				} );
			},
		} );
	};

	const onTogglePrerender = () => {
		setModuleState( 'speculation_rules', ! isPrerenderOn );
	};

	// "Include default pages" — additive merge of the server-side
	// curated list (Yoast, WooCommerce, etc.) into the current draft,
	// truncated to the plan's free slot count.
	const defaultPages = useMemo(
		() => properties?.default_pages ?? [],
		[ properties?.default_pages ]
	);
	const currentPages = useMemo( () => parseTextareaToList( draft ), [ draft ] );
	const missingDefaults = useMemo(
		() => defaultPages.filter( p => ! currentPages.includes( p ) ),
		[ defaultPages, currentPages ]
	);
	const availableSlots = Math.max( 0, maxItems - currentPages.length );
	const includeDisabled =
		defaultPages.length === 0 || missingDefaults.length === 0 || availableSlots === 0 || isSaving;
	const includeTooltip = ( () => {
		if ( defaultPages.length === 0 ) {
			return __( 'No default pages available. Add pages manually.', 'jetpack-boost' );
		}
		if ( missingDefaults.length === 0 ) {
			return __( 'Default pages are already included.', 'jetpack-boost' );
		}
		if ( availableSlots === 0 ) {
			return __( 'Cannot include defaults. Plan limit reached.', 'jetpack-boost' );
		}
		const pagesToLoad = Math.min( missingDefaults.length, availableSlots );
		if ( pagesToLoad < missingDefaults.length ) {
			return sprintf(
				/* translators: %1$d is the count that will be loaded; %2$d is the total available. */
				__( 'Include %1$d of %2$d default pages (plan limit).', 'jetpack-boost' ),
				pagesToLoad,
				missingDefaults.length
			);
		}
		return sprintf(
			/* translators: %d is the number of pages that will be included. */
			_n(
				'Include %d default page from compatible plugins.',
				'Include %d default pages from compatible plugins.',
				pagesToLoad,
				'jetpack-boost'
			),
			pagesToLoad
		);
	} )();
	const onIncludeDefaults = () => {
		const slice = missingDefaults.slice( 0, availableSlots );
		const next = [ ...currentPages, ...slice ].join( '\n' );
		setDraft( next );
	};

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header>
				<div className="jetpack-boost-cornerstone__header">
					<Card.Title>{ __( 'Cornerstone Pages', 'jetpack-boost' ) }</Card.Title>
					<span className="jetpack-boost-cornerstone__summary">{ summary }</span>
				</div>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<p className="jetpack-boost-cornerstone__description">
					{ createInterpolateElement(
						__(
							'List the most important pages of your site. These pages will receive specially tailored optimizations, including targeted critical CSS. The Page Speed scores are based on your homepage, which is automatically included. <link>Learn more</link>',
							'jetpack-boost'
						),
						{ link: <Link openInNewTab href={ supportLink } /> }
					) }
				</p>

				{ ! isPremium && (
					<UpgradeCTA
						identifier="cornerstone-10-pages"
						description={ sprintf(
							/* translators: %d is the premium page limit. */
							__(
								'Free plans can list one cornerstone page on top of the homepage. Upgrade to add up to %d.',
								'jetpack-boost'
							),
							properties?.max_pages_premium ?? 10
						) }
					/>
				) }

				{ propertiesQuery.isLoading && ! properties ? (
					<div className="jetpack-boost-cornerstone__loading">
						<Spinner />
					</div>
				) : (
					<div className="jetpack-boost-cornerstone__editor">
						<p className="jetpack-boost-cornerstone__label">
							<strong>{ __( 'Homepage:', 'jetpack-boost' ) }</strong>
						</p>
						<ul className="jetpack-boost-cornerstone__predefined">
							{ ( properties?.predefined_pages ?? [ Jetpack_Boost.site.url ] ).map( item => (
								<li key={ item }>{ item }</li>
							) ) }
						</ul>

						<label
							className="jetpack-boost-cornerstone__label"
							htmlFor="jetpack-boost-cornerstone-textarea"
						>
							<strong>{ __( 'Custom:', 'jetpack-boost' ) }</strong>
						</label>
						<textarea
							id="jetpack-boost-cornerstone-textarea"
							className="jetpack-boost-cornerstone__textarea"
							rows={ isPremium ? 10 : 5 }
							value={ draft }
							onChange={ e => setDraft( e.target.value ) }
						/>
						{ validationError && (
							<p className="jetpack-boost-cornerstone__error">{ validationError }</p>
						) }
						<p className="jetpack-boost-cornerstone__helper">
							{ createInterpolateElement(
								sprintf(
									/* translators: %s is the site URL. */
									__(
										'Add one URL per line. Only URLs starting with <b>%s</b> will be included. Relative URLs are automatically expanded.',
										'jetpack-boost'
									),
									Jetpack_Boost.site.url
								),
								{ b: <strong /> }
							) }
						</p>

						<div className="jetpack-boost-cornerstone__actions">
							<Button
								variant="primary"
								disabled={ ! isDirty || isSaving || !! validationError }
								isBusy={ isSaving }
								onClick={ onSave }
							>
								{ __( 'Save', 'jetpack-boost' ) }
							</Button>
							{ /*
							   Native `title` attribute carries the same plan-aware
							   copy the legacy `Tooltip` exposes. `Tooltip` from
							   `@wordpress/ui` requires its `Trigger` to BE the
							   button (it renders one); wrapping our own Button
							   would double-up the element. The native title is
							   the lowest-friction port.
							*/ }
							<Button
								variant="link"
								disabled={ includeDisabled }
								onClick={ onIncludeDefaults }
								title={ includeTooltip }
							>
								{ __( 'Include default pages', 'jetpack-boost' ) }
							</Button>
						</div>
					</div>
				) }

				{ isSpeculationAvailable && (
					<div className="jetpack-boost-cornerstone__prerender">
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Prerender Cornerstone Pages', 'jetpack-boost' ) }
							help={ __(
								'Prerender these pages to improve their loading performance, but be mindful of potential drawbacks.',
								'jetpack-boost'
							) }
							checked={ isPrerenderOn }
							disabled={ isPrerenderBusy }
							onChange={ onTogglePrerender }
						/>
					</div>
				) }
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
