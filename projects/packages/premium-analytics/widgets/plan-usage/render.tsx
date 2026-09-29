/**
 * External dependencies
 */
import {
	getOverLimitMessage,
	getPlanUpgradeUrl,
	PlanUsageMeter,
	usePlanUsage,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { percent } from '@wordpress/icons';
import { Link, Stack, Text } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { PlanUsageAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The usage endpoint ignores report params — it reports the current billing
// cycle, with no date range or comparison period — but WidgetRoot still expects
// them on `attributes`.
type PlanUsageRenderAttributes = PlanUsageAttributes & Partial< ReportParamsFieldAttributes >;
type PlanUsageWidgetProps = WidgetRenderProps< PlanUsageRenderAttributes >;

type PlanUsageBarProps = {
	limit: number;
	usage?: number;
	daysToReset?: number;
	/** Number of recent billing cycles the site has exceeded its limit. */
	overLimitMonths: number | null;
};

/**
 * The meter and the upgrade note. Renders the populated state only — `WidgetState` owns loading,
 * error, and unavailable.
 */
function PlanUsageBar( { limit, usage, daysToReset, overLimitMonths }: PlanUsageBarProps ) {
	const upgradeHref = getPlanUpgradeUrl();

	return (
		<Stack
			className={ styles.root }
			direction="column"
			align="stretch"
			justify="safe center"
			gap="md"
		>
			<PlanUsageMeter limit={ limit } usage={ usage } daysToReset={ daysToReset } />
			{ ( !! overLimitMonths || upgradeHref ) && (
				<Text className={ styles.note } variant="body-sm">
					{ overLimitMonths ? (
						<>
							<strong>{ getOverLimitMessage( overLimitMonths ) }</strong>{ ' ' }
						</>
					) : null }
					{ /* Without script data there is no purchase URL, and a Link with no
					     href renders styled but non-actionable — omit the sentence. */ }
					{ upgradeHref &&
						createInterpolateElement(
							__(
								'Do you want to increase your views limit? <a>Upgrade now</a>',
								'jetpack-premium-analytics-pkg'
							),
							{ a: <Link href={ upgradeHref } /> }
						) }
				</Text>
			) }
		</Stack>
	);
}

/**
 * The plan-usage endpoint is a point-in-time reading of the connected plan, so
 * it takes no report params.
 */
function PlanUsageReport() {
	const { data, isLoading, isFetching, isError, refetch, limit, overLimitMonths } = usePlanUsage();

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			// The query keeps prior data via `placeholderData`, so a transient refetch
			// failure keeps the usage bar visible; only surface the error when there is
			// nothing to show.
			isError={ ! data && isError }
			isEmpty={ limit === null }
			error={ {
				description: __(
					"We couldn't load plan usage. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: percent,
				description: __(
					"Plan usage isn't available for your current plan.",
					'jetpack-premium-analytics-pkg'
				),
			} }
		>
			{ limit !== null && (
				<PlanUsageBar
					limit={ limit }
					usage={ data?.current_usage?.views_count }
					daysToReset={ data?.current_usage?.days_to_reset }
					overLimitMonths={ overLimitMonths }
				/>
			) }
		</WidgetState>
	);
}

export default function PlanUsage( { attributes = {} }: PlanUsageWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PlanUsageReport />
		</WidgetRoot>
	);
}
