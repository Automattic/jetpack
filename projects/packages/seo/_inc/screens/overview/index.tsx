/* eslint-disable react/jsx-no-bind */

import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Notice, Stack } from '@wordpress/ui';
import EnableSeoCard from '../../components/enable-seo-card';
import UpsellBanner from '../../components/upsell-banner';
import { aiStore } from '../../data/ai-store';
import { coverageStore } from '../../data/coverage-store';
import getOverview from '../../data/get-overview';
import { isGated } from '../../data/is-gated';
import { settingsStore } from '../../data/settings-store';
import AiCrawlerCard from './ai-crawler-card';
import ContentCoverageCard, { type ContentNeed } from './content-coverage-card';
import SiteVerificationCard from './site-verification-card';
import SiteVisibilityCard from './site-visibility-card';
import styles from './style.module.scss';
import type { FC } from 'react';

const OverviewScreen: FC = () => {
	const data = getOverview();
	const navigate = useNavigate();

	// Coverage comes from the shared store (seeded from the bootstrap) so a save
	// in the Content route's inspector reflects here on navigation, no reload.
	const coverage = useSelect( select => select( coverageStore ).getCoverage(), [] );

	// Site-visibility toggles live in the Settings route, so read them from the
	// settings store (seeded from the bootstrap, updated on each save) rather than
	// the static Overview bootstrap — otherwise a toggle there wouldn't reflect
	// here until a full reload. The "View" link itself lives on the Settings tab.
	const settings = useSelect( select => select( settingsStore ).getSettings(), [] );

	// AI-crawler state lives in the same store the GEO tab uses (seeded from the
	// page's `ai` preload), so the Overview reads it directly rather than adding a
	// crawler slice to the Overview payload.
	const crawlers = useSelect( select => select( aiStore ).getCrawlers(), [] );

	const llmsTxt = useSelect( select => select( aiStore ).getLlmsTxt(), [] );

	// Deep-link to a Settings section: navigate to the Settings route with
	// `?focus=`, which the Settings screen reads to scroll the section to top.
	const goToSection = useCallback(
		( section: 'visibility' | 'verification' ) =>
			navigate( { href: `/settings?focus=${ encodeURIComponent( section ) }` } ),
		[ navigate ]
	);

	// Deep-link to the Content route.
	const goToContent = useCallback( () => navigate( { href: '/content' } ), [ navigate ] );

	// Deep-link to the Content route filtered to the rows still missing a field
	// (`?needs=`, read by the Content screen). Clicking a coverage ring lands the
	// user on exactly the content there's an action to take on.
	const goToContentNeeds = useCallback(
		( need: ContentNeed ) => navigate( { href: `/content?needs=${ encodeURIComponent( need ) }` } ),
		[ navigate ]
	);

	// Deep-link to the GEO route.
	const goToAi = useCallback( () => navigate( { href: '/ai' } ), [ navigate ] );

	if ( ! data ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>{ __( 'Unable to load overview.', 'jetpack-seo' ) }</Notice.Description>
			</Notice.Root>
		);
	}

	// Overlay the live Settings-store visibility values on the Overview bootstrap so a
	// toggle reflects here without a reload; rendered by the Site visibility card in
	// both the gated and ungated layouts.
	const siteVisibilityData = {
		...data.site_visibility,
		search_engines_visible:
			settings?.search_engines_visible ?? data.site_visibility.search_engines_visible,
		sitemap_active: settings?.sitemap_active ?? data.site_visibility.sitemap_active,
	};

	// On plan-gated sites (below-Premium WordPress.com) the Overview reduces to the
	// two always-valid cards (site visibility + verification, both backed by core
	// WordPress options) topped with the upsell banner. The AI-crawler and
	// content-coverage cards and the disable control are paid surfaces, hidden here.
	if ( isGated() ) {
		return (
			// Column Stack (matching the Settings tab) so the upsell banner — which sits
			// below the cards and isn't dismissible — has space above it.
			<Stack direction="column" gap="lg" className={ styles.root }>
				<div className={ styles.grid }>
					<SiteVisibilityCard
						data={ siteVisibilityData }
						onManage={ () => goToSection( 'visibility' ) }
					/>
					<SiteVerificationCard
						data={ data.site_verification }
						active={ settings?.verification_tools_active ?? false }
						onManage={ () => goToSection( 'verification' ) }
					/>
				</div>
				<UpsellBanner />
			</Stack>
		);
	}

	// When the `seo-tools` module is off, the Overview shows only the enable
	// affordance — the cards have nothing to act on until SEO tools are turned on,
	// and the Settings surface isn't registered server-side yet. See
	// `useSeoToolsToggle` and `Initializer::init()`.
	if ( ! data.site_visibility.seo_tools_active ) {
		return (
			<div className={ styles.root }>
				<EnableSeoCard />
			</div>
		);
	}

	return (
		<div className={ styles.root }>
			{ ! data.plan.seo_enabled_for_site && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ __(
							'SEO tools are not enabled on this site. Some cards reflect the underlying WordPress options only.',
							'jetpack-seo'
						) }
					</Notice.Description>
				</Notice.Root>
			) }
			<div className={ styles.grid }>
				<SiteVisibilityCard
					data={ siteVisibilityData }
					onManage={ () => goToSection( 'visibility' ) }
				/>
				<SiteVerificationCard
					data={ data.site_verification }
					active={ settings?.verification_tools_active ?? false }
					onManage={ () => goToSection( 'verification' ) }
				/>
				{ crawlers && (
					<AiCrawlerCard
						data={ crawlers }
						searchEnginesVisible={
							settings?.search_engines_visible ?? crawlers.searchEnginesVisible
						}
						llmsTxt={ llmsTxt }
						onManage={ goToAi }
					/>
				) }
			</div>
			<div className={ styles.contentCard }>
				<ContentCoverageCard
					data={ coverage ?? data.content_coverage }
					onManage={ goToContent }
					onFilter={ goToContentNeeds }
				/>
			</div>
		</div>
	);
};

export default OverviewScreen;
