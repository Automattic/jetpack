/* eslint-disable react/jsx-no-bind */

import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Notice } from '@wordpress/ui';
import EnableSeoCard from '../../components/enable-seo-card';
import { coverageStore } from '../../data/coverage-store';
import getOverview from '../../data/get-overview';
import { settingsStore } from '../../data/settings-store';
import ContentCoverageCard from './content-coverage-card';
import DisableSeoTools from './disable-seo-tools';
import SiteVerificationCard from './site-verification-card';
import SiteVisibilityCard from './site-visibility-card';
import './style.scss';
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

	// Deep-link to a Settings section: navigate to the Settings route with
	// `?focus=`, which the Settings screen reads to scroll the section to top.
	const goToSection = useCallback(
		( section: 'visibility' | 'verification' ) =>
			navigate( { href: `/settings?focus=${ encodeURIComponent( section ) }` } ),
		[ navigate ]
	);

	// Deep-link to the Content route.
	const goToContent = useCallback( () => navigate( { href: '/content' } ), [ navigate ] );

	if ( ! data ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>{ __( 'Unable to load overview.', 'jetpack-seo' ) }</Notice.Description>
			</Notice.Root>
		);
	}

	// When the `seo-tools` module is off, the Overview shows only the enable
	// affordance — the cards have nothing to act on until SEO tools are turned on,
	// and the Settings surface isn't registered server-side yet. See
	// `useSeoToolsToggle` and `Initializer::init()`.
	if ( ! data.site_visibility.seo_tools_active ) {
		return (
			<div className="jetpack-seo-overview">
				<EnableSeoCard />
			</div>
		);
	}

	return (
		<div className="jetpack-seo-overview">
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
			<div className="jetpack-seo-overview__grid">
				<SiteVisibilityCard
					data={ {
						...data.site_visibility,
						search_engines_visible:
							settings?.search_engines_visible ?? data.site_visibility.search_engines_visible,
						sitemap_active: settings?.sitemap_active ?? data.site_visibility.sitemap_active,
					} }
					onManage={ () => goToSection( 'visibility' ) }
				/>
				<SiteVerificationCard
					data={ data.site_verification }
					onManage={ () => goToSection( 'verification' ) }
				/>
			</div>
			<div className="jetpack-seo-overview__content-card">
				<ContentCoverageCard data={ coverage ?? data.content_coverage } onManage={ goToContent } />
			</div>
			<DisableSeoTools />
		</div>
	);
};

export default OverviewScreen;
