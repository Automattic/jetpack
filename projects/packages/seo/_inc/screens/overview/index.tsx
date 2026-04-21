/* eslint-disable jsdoc/require-returns */

import { BoundedLayout } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import useOverview from '../../data/use-overview';
import AiDiscoverabilityCard from './ai-discoverability-card';
import ContentHealthCard from './content-health-card';
import SeoGuide from './seo-guide';
import SiteVisibilityCard from './site-visibility-card';
import styles from './style.module.scss';
import type { OverviewResponse } from '../../data/overview-types';
import type { FC } from 'react';

/**
 * Overview screen, redesigned around a single SEO guide aggregator and a
 * pair of status cards. One `/overview` call feeds every widget so the
 * page loads with a single round-trip. Card chrome renders immediately
 * via CardSkeleton placeholders — actual content fills in as the data
 * resolves.
 */
const OverviewScreen: FC = () => {
	const { data, isError, error } = useOverview();

	if ( isError ) {
		return (
			<BoundedLayout width="wide">
				<Notice.Root intent="error">
					<Notice.Description>
						{ error?.message ?? __( 'Unable to load overview.', 'jetpack-seo' ) }
					</Notice.Description>
				</Notice.Root>
			</BoundedLayout>
		);
	}

	return (
		<BoundedLayout width="wide">
			{ data && ! data.plan.seo_enabled_for_site && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ __(
							'SEO tools are not enabled on this site. Some cards reflect the underlying WordPress options only.',
							'jetpack-seo'
						) }
					</Notice.Description>
				</Notice.Root>
			) }

			<OverviewBody data={ data } />
		</BoundedLayout>
	);
};

const OverviewBody: FC< { data?: OverviewResponse } > = ( { data } ) => (
	<div className={ styles.mainRow }>
		<SeoGuide data={ data } />
		<ContentHealthCard data={ data?.content_seo } />
		<SiteVisibilityCard data={ data?.site_visibility } />
		<AiDiscoverabilityCard data={ data?.ai_discoverability } />
	</div>
);

export default OverviewScreen;
