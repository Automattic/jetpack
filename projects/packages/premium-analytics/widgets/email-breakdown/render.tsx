/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import {
	GeoChart,
	LeaderboardChart,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	flagUrl,
	safeHttpUrl,
	sharePercentage,
	useWidgetRootContext,
	type LeaderboardChartData,
	type LeaderboardRowMedia,
	type GeoData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useResizeObserver } from '@wordpress/compose';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
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

// Mirrors the 720px container query in `style.module.css`, where the map is
// `display: none`: mounting `GeoChart` below it would pay the Google Charts load
// for a chart that can never be seen. This gates only the mount, not the visuals.
export const MAP_MIN_WIDTH = 720;

function buildEmailGeoData( rows: EmailBreakdownRow[], metric: EmailBreakdownMetric ): GeoData {
	return [
		[
			__( 'Country', 'jetpack-premium-analytics-pkg' ),
			metric === 'clicks'
				? __( 'Clicks', 'jetpack-premium-analytics-pkg' )
				: __( 'Opens', 'jetpack-premium-analytics-pkg' ),
		],
		...rows
			.filter( row => Boolean( row.countryCode ) )
			.map( row => [ row.countryCode as string, row.value ] as [ string, number ] ),
	];
}

/**
 * Shares are relative to the highest value in the set so the top row always
 * fills. The breakdown endpoints return no comparison period, so the comparison
 * fields are zeroed and the chart renders without deltas.
 */
function buildLeaderboardData(
	rows: EmailBreakdownRow[],
	view: EmailBreakdownView
): LeaderboardChartData {
	const maxValue = Math.max( ...rows.map( row => row.value ), 0 );

	return rows.map( row => {
		const media: LeaderboardRowMedia =
			view === 'countries'
				? {
						kind: 'flag',
						url: row.countryCode ? flagUrl( row.countryCode ) ?? undefined : undefined,
						country: row.countryFull ?? row.label,
				  }
				: { kind: 'none' };
		// Link rows come from remote data, so only render an anchor for safe
		// http(s) URLs. Other link-type rows fall back to static text.
		const safeUrl = view === 'links' ? safeHttpUrl( row.link ) : null;

		return {
			id: String( row.id ),
			...buildLeaderboardRow( {
				label: row.label,
				media,
				action: safeUrl ? { kind: 'link', href: safeUrl } : { kind: 'static' },
			} ),
			currentValue: row.value,
			currentShare: sharePercentage( row.value, maxValue ),
			previousValue: 0,
			previousShare: 0,
			delta: 0,
		};
	} );
}

function emptyStateText( view: EmailBreakdownView ): string {
	switch ( view ) {
		case 'devices':
			return __( 'No device data for this email yet.', 'jetpack-premium-analytics-pkg' );
		case 'clients':
			return __( 'No email client data for this email yet.', 'jetpack-premium-analytics-pkg' );
		case 'links':
			return __( 'No link clicks for this email yet.', 'jetpack-premium-analytics-pkg' );
		case 'countries':
		default:
			return __( 'No country data for this email yet.', 'jetpack-premium-analytics-pkg' );
	}
}

type EmailBreakdownLeaderboardProps = {
	rows?: EmailBreakdownRow[];
	/** Uncapped row set for the map; can hold more entries than `rows`. */
	mapRows?: EmailBreakdownRow[];
	view?: EmailBreakdownView;
	showMap?: boolean;
	metric?: EmailBreakdownMetric;
	isLoading?: boolean;
	isFetching?: boolean;
	isError?: boolean;
	/** `false` prompts to select an email instead of "no data yet". */
	hasEmail?: boolean;
	onRetry?: () => void;
};

/**
 * Takes already-fetched rows via props, and is exported, so Storybook can
 * exercise every state with fixture rows: there is no analytics backend there,
 * so the data-connected entry point would only ever show chrome.
 */
export const EmailBreakdownLeaderboard = ( {
	rows = [],
	mapRows = rows,
	view = 'countries',
	showMap = false,
	metric = 'opens',
	isLoading = false,
	isFetching = false,
	isError = false,
	hasEmail = true,
	onRetry,
}: EmailBreakdownLeaderboardProps ) => {
	const data = useMemo( () => buildLeaderboardData( rows, view ), [ rows, view ] );
	const geoData = useMemo( () => buildEmailGeoData( mapRows, metric ), [ mapRows, metric ] );

	// Until the first measurement lands the map stays unmounted, so a narrow
	// container never loads Google Charts at all.
	const [ width, setWidth ] = useState< number >();
	const measureRef = useResizeObserver< HTMLDivElement >( entries => {
		const rect = entries[ 0 ]?.contentRect;
		if ( rect ) {
			// Round and dedupe so subpixel resize reports don't churn renders.
			const next = Math.round( rect.width );
			setWidth( previous => ( previous === next ? previous : next ) );
		}
	} );
	const renderMap =
		showMap && view === 'countries' && geoData.length > 1 && ( width ?? 0 ) >= MAP_MIN_WIDTH;

	return (
		<div ref={ measureRef } className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ rows.length === 0 }
				error={ {
					description: __(
						"We couldn't load this email's breakdown. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: onRetry
						? [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: onRetry } ]
						: undefined,
				} }
				empty={ {
					icon: envelope,
					description: hasEmail
						? emptyStateText( view )
						: __( 'Select an email to see its breakdown.', 'jetpack-premium-analytics-pkg' ),
				} }
			>
				<div className={ renderMap ? styles.locationContent : styles.content }>
					<LeaderboardChart
						className={ styles.leaderboard }
						data={ data }
						withComparison={ false }
						withOverlayLabel
						showLegend={ false }
						dataFormat={ DATA_FORMAT }
					/>
					{ renderMap && (
						<div className={ styles.map } data-testid="email-breakdown-map">
							<GeoChart data={ geoData } />
						</div>
					) }
				</div>
			</WidgetState>
		</div>
	);
};

type EmailBreakdownReportProps = {
	view: EmailBreakdownView;
	metric: EmailBreakdownMetric;
	showMap: boolean;
};

/**
 * The email is scoped by the host through `reportParams.post_id` — the shared
 * single-resource "detail page" param — so the widget needs no id attribute.
 */
function EmailBreakdownReport( { view, metric, showMap }: EmailBreakdownReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

	const { allRows, rows, isLoading, isFetching, isError, refetch } = useEmailBreakdownRows( {
		postId,
		view,
		metric,
		max: WIDGET_ROW_LIMIT,
	} );

	return (
		<EmailBreakdownLeaderboard
			rows={ rows }
			mapRows={ allRows }
			view={ view }
			showMap={ showMap }
			metric={ metric }
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ isError }
			hasEmail={ postId > 0 }
			onRetry={ refetch }
		/>
	);
}

/**
 * The endpoints report across the whole lifetime of the email, so the date range
 * and comparison period are ignored: only `post_id` is read from `reportParams`.
 */
export default function EmailBreakdown( { attributes = {} }: EmailBreakdownWidgetProps ) {
	const view = attributes.view ?? 'countries';
	const metric = attributes.metric ?? 'opens';
	const showMap = attributes.showMap ?? false;

	return (
		<WidgetRoot attributes={ attributes }>
			<EmailBreakdownReport view={ view } metric={ metric } showMap={ showMap } />
		</WidgetRoot>
	);
}
