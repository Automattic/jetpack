import { __ } from '@wordpress/i18n';
import styles from './dashboard-skeleton.module.scss';
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
	<div className={ styles.root } role="status" aria-busy="true">
		<span className={ styles.label }>{ __( 'Loading…', 'jetpack-seo' ) }</span>
		{ [ 0, 1, 2 ].map( index => (
			<div key={ index } className={ styles.card } aria-hidden="true">
				<div className={ `${ styles.line } ${ styles.title }` } />
				<div className={ styles.line } />
				<div className={ `${ styles.line } ${ styles.short }` } />
			</div>
		) ) }
	</div>
);

export default DashboardSkeleton;
