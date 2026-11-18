/**
 * External dependencies
 */
import { Icon } from '@jetpack-premium-analytics/externals';
import { jetpack } from '@jetpack-premium-analytics/icons';
import { useStatsBreadcrumbs } from '@jetpack-premium-analytics/ui';
import {
	LockedPage,
	ReportPageLayout,
	StatsOptionsMenu,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
/**
 * Internal dependencies
 */
import reportPageStyles from './page.module.scss';
import type { StatsFeatureKey } from '@jetpack-premium-analytics/data';
import type { JSX } from 'react';

type LockedReportPageProps = {
	/** The report's name, for its crumb and heading. */
	label: string;
	/** The locked feature. */
	feature: StatsFeatureKey;
};

/**
 * A report the site's plan does not include: its header, with the locked state where the records go.
 *
 * @param props         - Component props.
 * @param props.label   - The report's name.
 * @param props.feature - The locked feature.
 * @return The locked report page.
 */
export function LockedReportPage( { label, feature }: LockedReportPageProps ): JSX.Element {
	const statsBreadcrumbs = useStatsBreadcrumbs( {
		items: [ { label } ],
		className: reportPageStyles.page,
	} );

	return (
		<Page
			{ ...statsBreadcrumbs }
			visual={ <Icon icon={ jetpack } /> }
			actions={ <StatsOptionsMenu /> }
		>
			<ReportPageLayout title={ label }>
				<LockedPage feature={ feature } />
			</ReportPageLayout>
		</Page>
	);
}
