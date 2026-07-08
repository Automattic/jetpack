/**
 * External dependencies
 */
import {
	useStatsEmailClicksBreakdown,
	useStatsEmailOpensBreakdown,
	type StatsEmailBreakdown,
	type StatsEmailOpensBreakdown,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LeaderboardLabel,
	WidgetLoadingOverlay,
	WidgetRoot,
	flagUrl,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type EmailBreakdownAttributes, type EmailBreakdownView } from './widget';
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
 * Maps the `countries`/`devices`/`clients` views onto their email opens
 * breakdown dimension. The `links` view is intentionally excluded: it reads the
 * clicks breakdown instead (only clicked links exist) and is handled separately.
 */
const VIEW_TO_OPENS_BREAKDOWN: Record<
	Exclude< EmailBreakdownView, 'links' >,
	StatsEmailOpensBreakdown
> = {
	countries: 'country',
	devices: 'device',
	clients: 'client',
};

/**
 * A single normalized breakdown row, flattened from the email breakdown report
 * into the shape the leaderboard renders. Exported so Storybook can build
 * fixtures for `EmailBreakdownLeaderboard`.
 */
export type EmailBreakdownRow = {
	/**
	 * Stable identifier for the row (its index in the report).
	 */
	id: string | number;
	/**
	 * Display label (country/device/client name, or link URL).
	 */
	label: string;
	/**
	 * Metric value (opens or clicks) for the row.
	 */
	value: number;
	/**
	 * Two-letter country code, present only for the `countries` view.
	 */
	countryCode?: string;
	/**
	 * Full country name, present only for the `countries` view.
	 */
	countryFull?: string;
	/**
	 * External URL, present only for clicked user-content links (`links` view).
	 */
	link?: string;
};

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

	return rows.map( ( row, index ) => {
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
			id: `${ index }-${ row.id }`,
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
	 * When `true` and there are no rows yet, the full loading overlay is shown.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, an in-place chart spinner is shown over existing rows during a
	 * background refetch.
	 */
	isFetching?: boolean;
	/**
	 * When `true`, an error message is rendered in place of the chart.
	 */
	isError?: boolean;
};

/**
 * Presentational leaderboard for the "Email breakdown" widget. Lists a single
 * email's opens (or link clicks) broken down by the active view.
 *
 * Takes already-fetched rows and the active view via props and owns only the
 * loading, error, empty, and populated states. Exported so Storybook can
 * exercise those states with fixture rows (there is no analytics backend in
 * Storybook, so the data-connected entry point would only ever show chrome).
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
}: EmailBreakdownLeaderboardProps ) => {
	const data = useMemo( () => buildLeaderboardData( rows, view ), [ rows, view ] );

	let body;
	if ( isError ) {
		body = (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ __( 'Unable to load email breakdown.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	} else if ( isLoading && rows.length === 0 ) {
		body = <WidgetLoadingOverlay />;
	} else {
		body = (
			<LeaderboardChart
				className={ styles.leaderboard }
				data={ data }
				loading={ isFetching }
				withComparison={ false }
				withOverlayLabel
				showLegend={ false }
				emptyStateText={ emptyStateText( view ) }
				dataFormat={ DATA_FORMAT }
			/>
		);
	}

	return <div className={ styles.root }>{ body }</div>;
};

/**
 * Flatten the email breakdown report into the rows the leaderboard renders,
 * keeping the endpoint's (already value-sorted) order and trimming to `max`.
 *
 * @param report - The normalized breakdown report, or undefined while loading.
 * @param max    - Maximum rows to display; `0` keeps all rows.
 * @return The normalized breakdown rows.
 */
function toRows( report: StatsEmailBreakdown | undefined, max: number ): EmailBreakdownRow[] {
	const items = report?.data?.[ 0 ]?.items ?? [];

	// `max = 0` means "all rows" (the Stats-widget convention), so only slice
	// when a positive `max` is requested.
	return items.slice( 0, max > 0 ? max : undefined ).map( ( item, index ) => ( {
		id: index,
		label: String( item.label ?? '' ),
		value: item.value,
		countryCode: item.countryCode,
		countryFull: item.countryFull ? String( item.countryFull ) : undefined,
		link: item.link,
	} ) );
}

type EmailBreakdownReportProps = {
	postId: number;
	view: EmailBreakdownView;
	max: number;
};

/**
 * Fetches the email breakdown report for the selected email and view, then hands
 * the normalized rows to the presentational `EmailBreakdownLeaderboard`.
 *
 * The `countries`/`devices`/`clients` views read the *opens* breakdown; the
 * `links` view reads the *clicks* breakdown. Both hooks are always called (rules
 * of hooks) but only the active one is enabled, so exactly one request is made.
 *
 * @param {EmailBreakdownReportProps} props - The component props.
 * @return The widget content.
 */
function EmailBreakdownReport( { postId, view, max }: EmailBreakdownReportProps ) {
	const isLinksView = view === 'links';
	// The opens hook always runs (rules of hooks) but is disabled for the links
	// view; `country` is an inert placeholder breakdown for that disabled case.
	const opensBreakdown: StatsEmailOpensBreakdown =
		view === 'links' ? 'country' : VIEW_TO_OPENS_BREAKDOWN[ view ];

	const opens = useStatsEmailOpensBreakdown( postId, opensBreakdown, {
		enabled: ! isLinksView,
	} );
	const clicks = useStatsEmailClicksBreakdown( postId, 'user-content-link', {
		enabled: isLinksView,
	} );

	const active = isLinksView ? clicks : opens;
	const report = active.data as StatsEmailBreakdown | undefined;

	const rows = useMemo( () => toRows( report, max ), [ report, max ] );

	return (
		<EmailBreakdownLeaderboard
			rows={ rows }
			view={ view }
			isLoading={ active.isLoading }
			isFetching={ active.isFetching }
			isError={ active.isError }
		/>
	);
}

/**
 * Widget render entry point.
 *
 * The breakdown is scoped to a single email via the `postId` attribute; the
 * `view` attribute (`relevance: 'high'`) is exposed as a control by the widget
 * host. The endpoints report across the whole lifetime of the email, so there is
 * no date range or comparison period — `reportParams` is still passed into
 * `WidgetRoot` so the host wiring stays consistent, but it is not used for data.
 *
 * @param {EmailBreakdownWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function EmailBreakdown( { attributes = {} }: EmailBreakdownWidgetProps ) {
	const postId = attributes.postId ?? 0;
	const view = attributes.view ?? 'countries';
	const max = attributes.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<EmailBreakdownReport postId={ postId } view={ view } max={ max } />
		</WidgetRoot>
	);
}
