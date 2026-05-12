import { getRedirectUrl } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Notice, Stack } from '@wordpress/ui';
import { useModulesState, type ModulesState } from '../lib/use-modules-state';
import { usePremiumFeatures } from '../lib/use-premium-features';
import CornerstonePagesCard from './cornerstone-pages-card';
import CriticalCssStatus from './critical-css-status';
import ImageCdnChildren from './image-cdn-children';
import ImageGuideChildren from './image-guide-children';
import LcpStatus from './lcp-status';
import MinifyMeta from './minify-meta';
import ModuleCard from './module-card';
import PageCacheMeta from './page-cache-meta';
import UpgradeCTA from './upgrade-cta';
import './settings.scss';
import type { ReactNode } from 'react';

type ModuleEntry = {
	slug: string;
	label: ReactNode;
	description: ReactNode;
	/**
	 * Renders sub-features inside the module card when the toggle is
	 * active. Closure form so the per-card component owns its own
	 * data-sync wiring + side effects without leaking up to the
	 * parent.
	 */
	children?: () => ReactNode;
	/**
	 * Renders content that should always appear regardless of toggle
	 * state — e.g. the Critical CSS manual→auto upgrade Notice. Kept
	 * separate from `children` so toggling the module on/off doesn't
	 * stash the upsell.
	 */
	persistent?: () => ReactNode;
};

function buildEntries(): ModuleEntry[] {
	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );

	return [
		{
			slug: 'critical_css',
			label: __( 'Optimize Critical CSS Loading (manual)', 'jetpack-boost' ),
			description: createInterpolateElement(
				__(
					'Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as <link>Critical CSS</link>.',
					'jetpack-boost'
				),
				{ link: <Link openInNewTab href={ criticalCssLink } /> }
			),
			children: () => <CriticalCssStatus mode="manual" />,
			persistent: () => <CriticalCssManualUpsell />,
		},
		{
			slug: 'cloud_css',
			label: __( 'Automatically Optimize CSS Loading', 'jetpack-boost' ),
			description: createInterpolateElement(
				__(
					'Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as <link>Critical CSS</link>.',
					'jetpack-boost'
				),
				{ link: <Link openInNewTab href={ criticalCssLink } /> }
			),
			children: () => <CriticalCssStatus mode="auto" />,
		},
		{
			slug: 'lcp',
			label: __( 'Optimize LCP Images', 'jetpack-boost' ),
			description: __(
				'Improve the Largest Contentful Paint (LCP) of your Cornerstone Pages, optimizing their key image, so users can enjoy a smoother experience.',
				'jetpack-boost'
			),
			children: () => <LcpStatus />,
		},
		{
			slug: 'page_cache',
			label: __( 'Cache Site Pages', 'jetpack-boost' ),
			description: __(
				'Store and serve preloaded content to reduce load times and enhance your site performance and user experience.',
				'jetpack-boost'
			),
			children: () => <PageCacheMeta />,
		},
		{
			slug: 'render_blocking_js',
			label: __( 'Defer Non-Essential JavaScript', 'jetpack-boost' ),
			description: createInterpolateElement(
				__(
					'Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly. Read more on <link>web.dev</link>.',
					'jetpack-boost'
				),
				{ link: <Link openInNewTab href={ deferJsLink } /> }
			),
		},
		{
			slug: 'minify_js',
			label: __( 'Concatenate JS', 'jetpack-boost' ),
			description: __(
				'Scripts are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
				'jetpack-boost'
			),
			children: () => (
				<MinifyMeta
					entryKey="minify_js_excludes"
					assetLabel={ __( 'JavaScript', 'jetpack-boost' ) }
					buttonText={ __( 'Exclude JS handles', 'jetpack-boost' ) }
				/>
			),
		},
		{
			slug: 'minify_css',
			label: __( 'Concatenate CSS', 'jetpack-boost' ),
			description: __(
				'Styles are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
				'jetpack-boost'
			),
			children: () => (
				<MinifyMeta
					entryKey="minify_css_excludes"
					assetLabel={ __( 'CSS', 'jetpack-boost' ) }
					buttonText={ __( 'Exclude CSS handles', 'jetpack-boost' ) }
				/>
			),
		},
		{
			slug: 'image_cdn',
			label: __( 'Image CDN', 'jetpack-boost' ),
			description: __(
				"Deliver images from Jetpack's Content Delivery Network. Automatically resizes your images to an appropriate size, converts them to modern efficient formats like WebP, and serves them from a worldwide network of servers.",
				'jetpack-boost'
			),
			children: () => <ImageCdnChildren />,
		},
		{
			slug: 'image_guide',
			label: __( 'Image Guide', 'jetpack-boost' ),
			description: __(
				"This feature helps you discover images that are too large. When you browse your site, the image guide will show you an overlay with information about each image's size.",
				'jetpack-boost'
			),
			children: () => <ImageGuideChildren />,
		},
	];
}

function isAvailable( slug: string, state: ModulesState | undefined ): boolean {
	if ( ! state ) {
		return true;
	}
	return state[ slug ]?.available !== false;
}

/**
 * Surface the Critical CSS manual → Cloud CSS upsell when the user
 * is on a free plan. Lives next to the manual Critical CSS card per
 * the legacy `InterstitialModalCTA` placement.
 *
 * Hooks are read inline rather than at the parent so the entry-build
 * loop stays declarative.
 *
 * @return Upgrade Notice element, or `null` if Cloud CSS is already
 *         available on this plan.
 */
function CriticalCssManualUpsell(): JSX.Element | null {
	const premium = usePremiumFeatures();
	if ( premium.isLoading || premium.has( 'cloud-critical-css' ) ) {
		return null;
	}
	return (
		<UpgradeCTA
			identifier="cloud-critical-css"
			description={ __(
				'Save time and skip the manual regenerate — upgrade to let Boost regenerate Critical CSS for you whenever the site changes.',
				'jetpack-boost'
			) }
		/>
	);
}

/**
 * Settings tab body. Renders the Cornerstone Pages collapsible card
 * (custom layout — not a toggle), followed by a flat list of
 * `ModuleCard`s that wire each Boost module's toggle, description,
 * and per-module sub-feature panel.
 *
 * Modules that report `available: false` are filtered out, mirroring
 * the legacy dashboard's "hide unavailable modules" behavior.
 *
 * @return The Settings tab content.
 */
export default function Settings(): JSX.Element {
	const modulesQuery = useModulesState();
	const isLoading = modulesQuery.isLoading;
	const modulesState = modulesQuery.data ?? undefined;
	const entries = buildEntries();

	return (
		<div className="jetpack-boost-settings">
			{ modulesQuery.isError && (
				<Notice.Root intent="error">
					<Notice.Title>
						{ __( "Couldn't load your Boost settings", 'jetpack-boost' ) }
					</Notice.Title>
					<Notice.Description>
						{ __(
							'Refresh the page to try again. If the problem persists, check that your site is reachable.',
							'jetpack-boost'
						) }
					</Notice.Description>
				</Notice.Root>
			) }

			{ isLoading && ! modulesState ? (
				<div className="jetpack-boost-settings__loading">
					<Spinner />
				</div>
			) : (
				<Stack direction="column" gap="md">
					<CornerstonePagesCard />
					{ entries
						.filter( entry => isAvailable( entry.slug, modulesState ) )
						.map( entry => (
							<ModuleCard
								key={ entry.slug }
								slug={ entry.slug }
								state={ modulesState?.[ entry.slug ] }
								isLoading={ isLoading }
								label={ entry.label }
								description={ entry.description }
								persistent={ entry.persistent ? entry.persistent() : undefined }
							>
								{ entry.children ? entry.children() : null }
							</ModuleCard>
						) ) }
				</Stack>
			) }
		</div>
	);
}
