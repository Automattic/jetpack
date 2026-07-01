import { __ } from '@wordpress/i18n';
import './dashboard-skeleton.scss';
import type { FC } from 'react';

/**
 * A loading placeholder for a dashboard tab: greyed card shapes that stand in for
 * the real content while it's fetched. Shown only on a degraded load (the data
 * wasn't preloaded onto the page); a normal load renders the content directly
 * with no skeleton. See [use-ensure-tab-data].
 *
 * @return The skeleton placeholder.
 */
const DashboardSkeleton: FC = () => (
	<div className="jetpack-seo-skeleton" role="status" aria-busy="true">
		<span className="jetpack-seo-skeleton__label">{ __( 'Loading…', 'jetpack-seo' ) }</span>
		{ [ 0, 1, 2 ].map( index => (
			<div key={ index } className="jetpack-seo-skeleton__card" aria-hidden="true">
				<div className="jetpack-seo-skeleton__line jetpack-seo-skeleton__line--title" />
				<div className="jetpack-seo-skeleton__line" />
				<div className="jetpack-seo-skeleton__line jetpack-seo-skeleton__line--short" />
			</div>
		) ) }
	</div>
);

export default DashboardSkeleton;
