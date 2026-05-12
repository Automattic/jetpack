import { useQueryClient } from '@tanstack/react-query';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button, Spinner } from '@wordpress/components';
import { createInterpolateElement, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import {
	useCornerstonePagesList,
	useCornerstonePagesProperties,
	useSetCornerstonePagesList,
} from '../lib/use-cornerstone-pages';
import { useRegenerateCriticalCss } from '../lib/use-critical-css-state';
import { useLcpState, useRequestLcpAnalyze } from '../lib/use-lcp-state';
import { useModulesState, useSetModuleState } from '../lib/use-modules-state';
import { usePremiumFeatures } from '../lib/use-premium-features';
import ModuleRow from './module-row';
import ModuleSubrow from './module-subrow';
import SectionCard from './section-card';
import UpgradeCTA from './upgrade-cta';

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
 * Validate the textarea input against the legacy URL rules.
 *
 * @param raw      - Textarea value.
 * @param maxItems - Plan's max custom page count.
 * @return Error message string, or null on success.
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

function formatTimeSince( ts: number | null | undefined ): string {
	if ( ! ts ) {
		return '';
	}
	const seconds = Math.max( 0, Math.floor( Date.now() / 1000 - ts ) );
	if ( seconds < 60 ) {
		return __( 'just now', 'jetpack-boost' );
	}
	const minutes = Math.floor( seconds / 60 );
	if ( minutes < 60 ) {
		return sprintf(
			/* translators: %d minutes ago. */
			_n( '%d minute ago', '%d minutes ago', minutes, 'jetpack-boost' ),
			minutes
		);
	}
	const hours = Math.floor( minutes / 60 );
	if ( hours < 24 ) {
		return sprintf(
			/* translators: %d hours ago. */
			_n( '%d hour ago', '%d hours ago', hours, 'jetpack-boost' ),
			hours
		);
	}
	const days = Math.floor( hours / 24 );
	return sprintf(
		/* translators: %d days ago. */
		_n( '%d day ago', '%d days ago', days, 'jetpack-boost' ),
		days
	);
}

type Props = {
	modulesState: ReturnType< typeof useModulesState >[ 'data' ];
	isLoading: boolean;
};

/**
 * Cornerstone pages section — the top section of the Settings tab
 * per the new IA. Contains the description, the **Edit pages**
 * subrow (URL editor expands inline with plan-aware validation +
 * Include defaults), the **Pre-render cornerstone pages** toggle,
 * and the **Optimize LCP Images for smoother experience** toggle
 * with its **Regenerate** subrow.
 *
 * LCP is grouped here rather than under "Image loading
 * optimization" because LCP optimization is keyed off the
 * cornerstone-pages list — both pieces are conceptually about the
 * site's important pages.
 *
 * @param props              - See `Props`.
 * @param props.modulesState
 * @param props.isLoading
 * @return The Cornerstone section card.
 */
export default function CornerstoneSection( { modulesState, isLoading }: Props ): JSX.Element {
	const supportLink = getRedirectUrl( 'jetpack-boost-cornerstone-pages' );
	const listQuery = useCornerstonePagesList();
	const propertiesQuery = useCornerstonePagesProperties();
	const setListMutation = useSetCornerstonePagesList();
	const [ , moduleMutation ] = useSetModuleState();
	const regenerateCss = useRegenerateCriticalCss();
	const premium = usePremiumFeatures();
	const client = useQueryClient();

	const lcpStateQuery = useLcpState();
	const analyze = useRequestLcpAnalyze();

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

	const speculation = modulesState?.speculation_rules;
	const isSpeculationAvailable = speculation?.available ?? false;
	const lcpModuleState = modulesState?.lcp;

	const onSave = () => {
		const next = parseTextareaToList( draft );
		setListMutation.mutate( next, {
			onSuccess: () => {
				if ( modulesState?.cloud_css?.active ) {
					regenerateCss.mutate( undefined as never );
				}
				client.invalidateQueries( {
					queryKey: [ 'jetpack_boost_ds', 'lcp_state' ],
				} );
			},
		} );
	};

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
	const onIncludeDefaults = () => {
		const slice = missingDefaults.slice( 0, availableSlots );
		setDraft( [ ...currentPages, ...slice ].join( '\n' ) );
	};

	const lcpUpdatedLabel = formatTimeSince( lcpStateQuery.data?.updated );
	const isLcpPending = lcpStateQuery.data?.status === 'pending';
	const isLcpBusy = isLcpPending || analyze.isPending;
	const lcpSummary = isLcpPending
		? __( 'Analyzing your cornerstone pages…', 'jetpack-boost' )
		: lcpUpdatedLabel
		? sprintf(
				/* translators: %s is the time since the last LCP optimization. */
				__( 'Last optimized %s', 'jetpack-boost' ),
				lcpUpdatedLabel
		  )
		: __( 'Not optimized yet', 'jetpack-boost' );
	const onRegenerateLcp = () => analyze.mutate( undefined as never );

	return (
		<SectionCard title={ __( 'Cornerstone pages', 'jetpack-boost' ) }>
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

			<ModuleSubrow summary={ summary } actionLabel={ __( 'Edit pages', 'jetpack-boost' ) }>
				{ propertiesQuery.isLoading && ! properties ? (
					<Spinner />
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
										'Add one URL per line. Only URLs starting with <b>%s</b> will be included.',
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
							<Button variant="link" disabled={ includeDisabled } onClick={ onIncludeDefaults }>
								{ __( 'Include default pages', 'jetpack-boost' ) }
							</Button>
						</div>
					</div>
				) }
			</ModuleSubrow>

			{ isSpeculationAvailable && (
				<ModuleRow
					slug="speculation_rules"
					state={ speculation }
					isLoading={ isLoading || moduleMutation.isPending }
					label={ __( 'Pre-render cornerstone pages', 'jetpack-boost' ) }
					description={ __(
						'Prerender these pages to improve their loading performance, but be mindful of potential drawbacks.',
						'jetpack-boost'
					) }
				/>
			) }

			<ModuleRow
				slug="lcp"
				state={ lcpModuleState }
				isLoading={ isLoading }
				label={ __( 'Optimize LCP Images for smoother experience', 'jetpack-boost' ) }
				description={ __(
					'Improve the Largest Contentful Paint (LCP) of your Cornerstone Pages, optimizing their key image, so users can enjoy a smoother experience.',
					'jetpack-boost'
				) }
			>
				<ModuleSubrow
					summary={ lcpSummary }
					actionLabel={ __( 'Regenerate', 'jetpack-boost' ) }
					onAction={ onRegenerateLcp }
					disabled={ isLcpBusy }
				/>
			</ModuleRow>
		</SectionCard>
	);
}
