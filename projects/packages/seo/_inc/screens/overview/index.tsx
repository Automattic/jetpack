/* eslint-disable react/jsx-no-bind */

import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Notice } from '@wordpress/ui';
import getOverview from '../../data/get-overview';
import SiteVerificationCard from './site-verification-card';
import SiteVisibilityCard from './site-visibility-card';
import './style.scss';
import type { FC } from 'react';

const OverviewScreen: FC = () => {
	const data = getOverview();
	const navigate = useNavigate();

	// Deep-link to a Settings section: switch to the Settings tab and set
	// `?focus=`, which the Settings screen reads to scroll the section to top.
	const goToSection = useCallback(
		( section: 'visibility' | 'verification' ) =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					tab: 'settings',
					focus: section,
				} ),
			} as unknown as Parameters< typeof navigate >[ 0 ] ),
		[ navigate ]
	);

	if ( ! data ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>{ __( 'Unable to load overview.', 'jetpack-seo' ) }</Notice.Description>
			</Notice.Root>
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
					data={ data.site_visibility }
					onManage={ () => goToSection( 'visibility' ) }
				/>
				<SiteVerificationCard
					data={ data.site_verification }
					onManage={ () => goToSection( 'verification' ) }
				/>
			</div>
		</div>
	);
};

export default OverviewScreen;
