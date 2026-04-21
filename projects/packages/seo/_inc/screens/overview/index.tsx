/* eslint-disable jsdoc/require-returns */

import { BoundedLayout } from '@automattic/jetpack-components';
import { Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import useOverview from '../../data/use-overview';
import AiDiscoverabilityCard from './ai-discoverability-card';
import ContentHealthCard from './content-health-card';
import SiteVerificationCard from './site-verification-card';
import SiteVisibilityCard from './site-visibility-card';
import styles from './style.module.scss';
import type { FC } from 'react';

/**
 * The visibility command center's home. One request to `/jetpack-seo/v1/overview`
 * powers every card.
 */
const OverviewScreen: FC = () => {
	const { data, isLoading, isError, error } = useOverview();

	if ( isLoading ) {
		return (
			<BoundedLayout width="wide">
				<div className={ styles.loading }>
					<Spinner />
					<span>{ __( 'Loading site visibility…', 'jetpack-seo' ) }</span>
				</div>
			</BoundedLayout>
		);
	}

	if ( isError || ! data ) {
		return (
			<BoundedLayout width="wide">
				<Notice status="error" isDismissible={ false }>
					{ error?.message ?? __( 'Unable to load overview.', 'jetpack-seo' ) }
				</Notice>
			</BoundedLayout>
		);
	}

	return (
		<BoundedLayout width="wide">
			{ ! data.plan.seo_enabled_for_site && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'SEO tools are not enabled on this site. Some cards reflect the underlying WordPress options only.',
						'jetpack-seo'
					) }
				</Notice>
			) }
			<div className={ styles.grid }>
				<SiteVisibilityCard data={ data.site_visibility } />
				<ContentHealthCard data={ data.content_seo } />
				<AiDiscoverabilityCard data={ data.ai_discoverability } />
				<SiteVerificationCard data={ data.site_verification } />
			</div>
		</BoundedLayout>
	);
};

export default OverviewScreen;
