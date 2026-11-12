/**
 * External dependencies
 */
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { StatsOptionsMenu } from '../stats-options-menu';
import type { ReactNode } from 'react';

type ReportPageActionsProps = {
	/** The report's own actions, such as its CSV download. */
	children?: ReactNode;
};

/**
 * The actions slot of a report page: the report's own actions, then the Stats options menu.
 *
 * @param {ReportPageActionsProps} props - The component props.
 * @return The slot content.
 */
export function ReportPageActions( { children }: ReportPageActionsProps ) {
	return (
		<Stack direction="row" align="center" gap="sm">
			{ children }

			<StatsOptionsMenu />
		</Stack>
	);
}
