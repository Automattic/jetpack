import { __ } from '@wordpress/i18n';
import { Card, Stack, VisuallyHidden } from '@wordpress/ui';
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
	<Stack direction="column" gap="lg" role="status" aria-busy="true">
		<VisuallyHidden>{ __( 'Loading…', 'jetpack-seo' ) }</VisuallyHidden>
		{ [ 0, 1, 2 ].map( index => (
			<Card.Root key={ index } aria-hidden="true">
				<Card.Content>
					<Stack direction="column" gap="md">
						<div className={ `${ styles.line } ${ styles.title }` } />
						<div className={ styles.line } />
						<div className={ `${ styles.line } ${ styles.short }` } />
					</Stack>
				</Card.Content>
			</Card.Root>
		) ) }
	</Stack>
);

export default DashboardSkeleton;
