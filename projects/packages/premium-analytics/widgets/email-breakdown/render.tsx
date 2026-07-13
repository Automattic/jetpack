/**
 * External dependencies
 */
import {
	LeaderboardChart,
	LeaderboardLabel,
	WidgetRoot,
	WidgetState,
	flagUrl,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
import { Link } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useEmailBreakdownRows, { type EmailBreakdownRow } from './use-email-breakdown-rows';
import {
	type EmailBreakdownAttributes,
	type EmailBreakdownMetric,
	type EmailBreakdownView,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type EmailBreakdownRenderAttributes = EmailBreakdownAttributes &
	Partial< ReportParamsFieldAttributes >;
type EmailBreakdownWidgetProps = WidgetRenderProps< EmailBreakdownRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

/**
 * Returns the URL only when it parses as an http(s) link, so remote link data
 * cannot smuggle a clickable `javascript:`/`data:` protocol into an anchor.
 *
 * @param url - The candidate URL from remote breakdown data.
 * @return The safe http(s) URL, or null when it is missing, unparseable, or a
 *         non-http(s) protocol.
 */
function safeHttpUrl( url: string | undefined ): string | null {
	if ( ! url ) {
		return null;
	}

	try {
		const { protocol } = new URL( url );
		return protocol === 'http:' || protocol === 'https:' ? url : null;
	} catch {
		return null;
	}
}

/**
 * Maps normalized breakdown rows onto the shape `LeaderboardChart` expects.
 * Shares are relative to the highest value in the set so the top row always
 * fills. The breakdown endpoints return no comparison period, so the comparison
 * fields are zeroed and the chart renders without deltas.
 *
 * The `countries` view renders a flag next to each label; the `links` view
 * renders each row as an external link; other views render a plain label.
 *
 * @param rows - The normalized breakdown rows.
 * @param view - The active breakdown view.
 * @return The leaderboard chart data.
 */
function buildLeaderboardData(
	rows: EmailBreakdownRow[],
	view: EmailBreakdownView
): LeaderboardChartData {
	const maxValue = Math.max( ...rows.map( row => row.value ), 0 );

	return rows.map( row => {
		let label;

		if ( view === 'countries' ) {
			const imageUrl = row.countryCode ? flagUrl( row.countryCode ) : null;
			label = (
				<div className={ styles.label }>
					<LeaderboardLabel
						label={ row.label }
						imageUrl={ imageUrl ?? undefined }
						imageAlt={ sprintf(
							/* translators: %s is the country name. */
							__( 'Flag of %s', 'jetpack-premium-analytics' ),
							row.countryFull ?? row.label
						) }
						imageClassName={ styles.flag }
					/>
				</div>
			);
		} else if ( view === 'links' ) {
			// Link rows come from remote data, so only render an anchor for safe
			// http(s) URLs; anything else (including internal link-type rows with no
			// URL) falls back to a plain-text label.
			const safeUrl = safeHttpUrl( row.link );
			label = safeUrl ? (
				<Link
					className={ styles.labelLink }
					href={ safeUrl }
					variant="unstyled"
					openInNewTab
					title={ row.label }
				>
					{ row.label }
				</Link>
			) : (
				<span className={ styles.labelText } title={ row.label }>
					{ row.label }
				</span>
			);
		} else {
			label = (
				<span className={ styles.labelText } title={ row.label }>
					{ row.label }
				</span>
			);
		}

		return {
			id: String( row.id ),
			label,
			currentValue: row.value,
			currentShare: maxValue > 0 ? ( row.value / maxValue ) * 100 : 0,
			previousValue: 0,
			previousShare: 0,
			delta: 0,
		};
	} );
}

/**
 * The per-view empty-state copy shown when the selected email has no data for
 * the active breakdown.
 *
 * @param view - The active breakdown view.
 * @return The empty-state text.
 */
function emptyStateText( view: EmailBreakdownView ): string {
	switch ( view ) {
		case 'devices':
			return __( 'No device data for this email yet.', 'jetpack-premium-analytics' );
		case 'clients':
			return __( 'No email client data for this email yet.', 'jetpack-premium-analytics' );
		case 'links':
			return __( 'No link clicks for this email yet.', 'jetpack-premium-analytics' );
		case 'countries':
		default:
			return __( 'No country data for this email yet.', 'jetpack-premium-analytics' );
	}
}

type EmailBreakdownLeaderboardProps = {
	/**
	 * Normalized breakdown rows to render. When omitted, the empty state is shown
	 * (unless `isLoading` is set).
	 */
	rows?: EmailBreakdownRow[];
	/**
	 * The active breakdown view; drives the label rendering and empty-state copy.
	 */
	view?: EmailBreakdownView;
	/**
	 * When `true` and there are no rows yet, the loading state is shown.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, a non-blocking busy overlay is shown over existing rows during
	 * a background refetch.
	 */
	isFetching?: boolean;
	/**
	 * When `true`, the error state is rendered in place of the chart.
	 */
	isError?: boolean;
	/**
	 * Whether an email is selected; drives the empty-state copy when there are no
	 * rows (`false` prompts to select an email instead of "no data yet").
	 */
	hasEmail?: boolean;
	/**
	 * Invoked by the error state's Retry action to re-run the queries.
	 */
	onRetry?: () => void;
};

/**
 * Presentational leaderboard for the "Email breakdown" widget. Lists a single
 * email's opens (or clicks) broken down by the active view.
 *
 * Takes already-fetched rows and the active view via props and renders the
 * loading, error, empty, and populated states through `WidgetState`. Exported so
 * Storybook can exercise those states with fixture rows (there is no analytics
 * backend in Storybook, so the data-connected entry point would only ever show
 * chrome).
 *
 * @param {EmailBreakdownLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export const EmailBreakdownLeaderboard = ( {
	rows = [],
	view = 'countries',
	isLoading = false,
	isFetching = false,
	isError = false,
	hasEmail = true,
	onRetry,
}: EmailBreakdownLeaderboardProps ) => {
	const data = useMemo( () => buildLeaderboardData( rows, view ), [ rows, view ] );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ rows.length === 0 }
				error={ {
					description: __(
						"We couldn't load this email's breakdown. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: onRetry
						? [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: onRetry } ]
						: undefined,
				} }
				empty={ {
					icon: envelope,
					description: hasEmail
						? emptyStateText( view )
						: __( 'Select an email to see its breakdown.', 'jetpack-premium-analytics' ),
				} }
			>
				<LeaderboardChart
					className={ styles.leaderboard }
					data={ data }
					withComparison={ false }
					withOverlayLabel
					showLegend={ false }
					dataFormat={ DATA_FORMAT }
				/>
			</WidgetState>
		</div>
	);
};

type EmailBreakdownReportProps = {
	view: EmailBreakdownView;
	metric: EmailBreakdownMetric;
	max: number;
};

/**
 * Resolves the email's post ID from the host-composed report params. `post_id`
 * is typed `string | number` (a string when it comes straight from the URL), so
 * it is coerced to a positive integer; anything else yields `0`, which the
 * widget treats as "no email selected".
 *
 * @param postId - The `post_id` report param.
 * @return The email's post ID, or `0` when none is set.
 */
function toPostId( postId: string | number | undefined ): number {
	const parsed = typeof postId === 'number' ? postId : Number.parseInt( postId ?? '', 10 );

	return Number.isInteger( parsed ) && parsed > 0 ? parsed : 0;
}

/**
 * Fetches the email breakdown rows for the selected email, view, and metric,
 * then hands them to the presentational `EmailBreakdownLeaderboard`. The email
 * is scoped by the host through `reportParams.post_id` — the shared
 * single-resource "detail page" param — so the widget needs no id attribute.
 *
 * @param {EmailBreakdownReportProps} props - The component props.
 * @return The widget content.
 */
function EmailBreakdownReport( { view, metric, max }: EmailBreakdownReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

	const { rows, isLoading, isFetching, isError, refetch } = useEmailBreakdownRows( {
		postId,
		view,
		metric,
		max,
	} );

	return (
		<EmailBreakdownLeaderboard
			rows={ rows }
			view={ view }
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ isError }
			hasEmail={ postId > 0 }
			onRetry={ refetch }
		/>
	);
}

/**
 * Widget render entry point.
 *
 * The breakdown is scoped to a single email by the host through
 * `reportParams.post_id` (the shared single-resource "detail page" param); the
 * `view` attribute (`relevance: 'high'`) is exposed as a control by the widget
 * host and the `metric` attribute picks opens or clicks for the dimension views.
 * The endpoints report across the whole lifetime of the email, so the date range
 * and comparison period are ignored — `reportParams` is passed into `WidgetRoot`,
 * which exposes it to the inner report, but only `post_id` is read from it.
 *
 * @param {EmailBreakdownWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function EmailBreakdown( { attributes = {} }: EmailBreakdownWidgetProps ) {
	const view = attributes.view ?? 'countries';
	const metric = attributes.metric ?? 'opens';
	const max = attributes.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<EmailBreakdownReport view={ view } metric={ metric } max={ max } />
		</WidgetRoot>
	);
}
