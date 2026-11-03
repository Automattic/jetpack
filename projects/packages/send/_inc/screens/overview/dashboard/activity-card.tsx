import { useViewportMatch } from '@wordpress/compose';
import { getSettings } from '@wordpress/date';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { inbox } from '@wordpress/icons';
import { Button, Card, EmptyState, Notice, Skeleton, Stack, Text } from '@wordpress/ui';
import DateRangeControl from '../../../components/date-range-control';
import ErrorNotice from '../../../components/error-notice';
import { PERIOD_PRESETS, periodKey } from '../../../data/period';
import AttentionNotice from './attention-notice';
import { chartBuckets, datesLine, metricTabs, statsPeriod } from './dashboard-state';
import MetricTabs from './metric-tabs';
import type { Attention, DashboardState } from './dashboard-state';
import type { Period, Stats } from '../../../data/types';

export const ACTIVITY_TITLE_ID = 'jetpack-send-activity-title';

/** The longest custom range the dashboard counts, in days. */
const MAX_RANGE_DAYS = 365;

type Props = {
	state: DashboardState;
	stats: Stats | null;
	error: string | null;
	/** Emails that didn't go out through Send in the period, said at the top of the card. */
	attention: Attention;
	/** The period asked for, which the control shows. */
	period: Period;
	onPeriodChange: ( period: Period ) => void;
	/** The first day the calendar offers, site-local `Y-m-d`. */
	earliest: string;
	/** Show the range control: the site has counted emails, so there's a range to pick. */
	showRange: boolean;
	/** Newer numbers are loading; the ones on screen stay until they land. */
	refreshing?: boolean;
	onRetry: () => void;
	/** Sending is paused, so new emails aren't logged. */
	paused: boolean;
	/** The records pass, so the server will take a test. */
	canEnable: boolean;
	onSendTest: () => void;
	sendingTest: boolean;
};

/**
 * Placeholders in the tabs' and chart's final size, so nothing jumps when data lands.
 *
 * @return The skeleton.
 */
const ActivitySkeleton = () => (
	<Stack direction="column" gap="md" aria-hidden="true">
		<div className="jetpack-send-metric-tabs__list">
			{ [ 0, 1, 2, 3 ].map( index => (
				<Skeleton key={ index } className="jetpack-send-skeleton jetpack-send-skeleton--tab" />
			) ) }
		</div>
		<Skeleton className="jetpack-send-skeleton jetpack-send-skeleton--chart" />
	</Stack>
);

/**
 * "Email activity": the dates and the range control, then metric tabs over a bar chart, or an
 * empty state. The control stays mounted while another period loads, so focus stays on it.
 *
 * @param props                - Component props.
 * @param props.state          - What to show.
 * @param props.stats          - Stats, or null while loading.
 * @param props.error          - The load error, if any.
 * @param props.attention      - Failed or host-sent emails worth a notice.
 * @param props.period         - The period asked for.
 * @param props.onPeriodChange - Pick another period.
 * @param props.earliest       - The first pickable day.
 * @param props.showRange      - Show the range control.
 * @param props.refreshing     - Newer numbers are loading.
 * @param props.onRetry        - Load again after an error.
 * @param props.paused         - Sending is paused.
 * @param props.canEnable      - The records pass.
 * @param props.onSendTest     - Send a test email.
 * @param props.sendingTest    - A test is on its way.
 * @return The section.
 */
const ActivityCard = ( {
	state,
	stats,
	error,
	attention,
	period,
	onPeriodChange,
	earliest,
	showRange,
	refreshing = false,
	onRetry,
	paused,
	canEnable,
	onSendTest,
	sendingTest,
}: Props ) => {
	const narrow = useViewportMatch( 'medium', '<' );
	const weekStartsOn = getSettings().l10n?.startOfWeek ?? 0;
	const chart = useMemo(
		() => ( stats ? chartBuckets( stats, { narrow, weekStartsOn } ) : null ),
		[ stats, narrow, weekStartsOn ]
	);
	const metrics = useMemo(
		() => ( stats && chart ? metricTabs( stats, chart.buckets ) : [] ),
		[ stats, chart ]
	);
	// Labels and links follow the numbers on screen, which stay while the next period loads.
	const shownPeriod = useMemo( () => ( stats ? statsPeriod( stats ) : period ), [ stats, period ] );
	const onRangeChange = useCallback(
		( next: Period | null ) => next && onPeriodChange( next ),
		[ onPeriodChange ]
	);

	let body = <ActivitySkeleton />;
	if ( state === 'error' ) {
		body = (
			<Stack direction="column" gap="md">
				<ErrorNotice message={ error ?? '' } />
				<div>
					<Button variant="outline" tone="neutral" onClick={ onRetry }>
						{ __( 'Try again', 'jetpack-send-pkg' ) }
					</Button>
				</div>
			</Stack>
		);
	} else if ( state === 'just-finished' ) {
		// Small and not a heading, so the test's row in Recent emails, which says when it went, stays in view.
		body = (
			<EmptyState.Root className="jetpack-send-activity__empty jetpack-send-activity__empty--compact">
				<EmptyState.Title render={ <p /> }>
					{ __( 'Your chart starts with your site’s first email.', 'jetpack-send-pkg' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __( 'Password resets, orders and form replies will show here.', 'jetpack-send-pkg' ) }
				</EmptyState.Description>
			</EmptyState.Root>
		);
	} else if ( state === 'no-data' ) {
		body = (
			<EmptyState.Root className="jetpack-send-activity__empty">
				<EmptyState.Icon icon={ inbox } />
				<EmptyState.Title>{ __( 'No emails yet.', 'jetpack-send-pkg' ) }</EmptyState.Title>
				<EmptyState.Description>
					{ __(
						'Password resets, orders and form replies will show here once your site sends them.',
						'jetpack-send-pkg'
					) }
				</EmptyState.Description>
				<EmptyState.Actions>
					<Button
						variant="outline"
						tone="neutral"
						onClick={ onSendTest }
						loading={ sendingTest }
						disabled={ paused || ! canEnable }
					>
						{ __( 'Send a test', 'jetpack-send-pkg' ) }
					</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		);
	} else if ( state === 'normal' && stats && chart ) {
		const chartKey = `${ periodKey( shownPeriod ) }-${ chart.unit }`;
		body = (
			<Stack direction="column" gap="md">
				{ attention && <AttentionNotice attention={ attention } period={ shownPeriod } /> }
				{ /* The Sending card says it's paused; this says only what that means for the chart. */ }
				{ paused && (
					<Notice.Root intent="info">
						<Notice.Description>
							{ __( 'Emails sent while paused aren’t logged here.', 'jetpack-send-pkg' ) }
						</Notice.Description>
					</Notice.Root>
				) }
				<MetricTabs
					key={ chartKey }
					metrics={ metrics }
					buckets={ chart.buckets }
					unit={ chart.unit }
					chartKey={ chartKey }
					narrow={ narrow }
				/>
			</Stack>
		);
	}

	// Title and range share the card header, as on the Stats chart cards.
	return (
		<Card.Root
			className="jetpack-send-activity"
			render={ <section aria-labelledby={ ACTIVITY_TITLE_ID } aria-busy={ refreshing } /> }
		>
			<Card.Header>
				<Stack
					direction="row"
					justify="space-between"
					align="center"
					gap="md"
					wrap="wrap"
					className="jetpack-send-activity__header"
				>
					<Stack direction="column" gap="xs">
						<Card.Title id={ ACTIVITY_TITLE_ID } render={ <h2 /> }>
							{ __( 'Email activity', 'jetpack-send-pkg' ) }
						</Card.Title>
						{ state === 'normal' && stats && (
							<Text variant="body-md" className="jetpack-send-muted jetpack-send-activity__dates">
								{ datesLine( stats ) }
							</Text>
						) }
					</Stack>
					{ showRange && (
						<DateRangeControl
							value={ period }
							onChange={ onRangeChange }
							presets={ PERIOD_PRESETS }
							earliest={ earliest }
							maxDays={ MAX_RANGE_DAYS }
							align="end"
						/>
					) }
				</Stack>
			</Card.Header>
			<Card.Content className="jetpack-send-activity__body">{ body }</Card.Content>
		</Card.Root>
	);
};

export default ActivityCard;
