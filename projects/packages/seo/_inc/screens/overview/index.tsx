import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import getOverview from '../../data/get-overview';
import SiteVisibilityCard from './site-visibility-card';
import './style.scss';
import type { FC } from 'react';

const OverviewScreen: FC = () => {
	const data = getOverview();

	if ( ! data ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>{ __( 'Unable to load overview.', 'jetpack-seo' ) }</Notice.Description>
			</Notice.Root>
		);
	}

	return (
		<>
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
				<SiteVisibilityCard data={ data.site_visibility } />
			</div>
		</>
	);
};

export default OverviewScreen;
