/**
 * External dependencies
 */
import { useStatsEmailSummary, type StatsEmailSummary } from '@jetpack-premium-analytics/data';
import { VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	AbbreviatedValue,
	formatEmailRate,
	isEmailRateKnown,
	LeaderboardSkeleton,
	MetricList,
	PostTitleLink,
	ReportLink,
	WIDGET_ROW_LIMIT,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	useWidgetNavigationSearch,
	type DataFormat,
	type MetricListItem,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type EmailMetric, type EmailsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type EmailsRenderAttributes = EmailsAttributes & Partial< ReportParamsFieldAttributes >;
type EmailsWidgetProps = WidgetRenderProps< EmailsRenderAttributes >;

/** A normalized email summary row. */
export type EmailRow = {
	/** Stable email identifier. */
	id: string | number;
	/** Newsletter post ID. */
	postId?: string | number;
	/** Public newsletter URL. */
	link?: string | null;
	/** Email subject. */
	label: string;
	opens: number;
	uniqueOpens: number;
	/** Open rate from 0 to 100. */
	opensRate: number;
	clicks: number;
	uniqueClicks: number;
	/** Click rate from 0 to 100. */
	clicksRate: number;
};

const METRIC_SECTION: Record< EmailMetric, string > = {
	opens: 'email-opens',
	clicks: 'email-clicks',
};

const COUNT_FORMAT: DataFormat = { type: 'number', options: { useMultipliers: true } };

type EmailsListProps = {
	/** Email rows to render. */
	rows?: EmailRow[];
	/** Count and rate to display. */
	metric?: EmailMetric;
};

function describeOpens( opens: number, rate: string, isRateKnown: boolean ): string {
	const exactOpens = formatMetricValue( opens, 'number', { decimals: 0, useMultipliers: false } );

	if ( ! isRateKnown ) {
		return sprintf(
			/* translators: %s: number of email opens, e.g. "1,287". */
			_n(
				'%s open, open rate unknown',
				'%s opens, open rate unknown',
				opens,
				'jetpack-premium-analytics-pkg'
			),
			exactOpens
		);
	}

	return sprintf(
		/* translators: 1: number of email opens, e.g. "1,287". 2: open rate, e.g. "41.2%". */
		_n(
			'%1$s open, %2$s open rate',
			'%1$s opens, %2$s open rate',
			opens,
			'jetpack-premium-analytics-pkg'
		),
		exactOpens,
		rate
	);
}

function describeClicks( clicks: number, rate: string, isRateKnown: boolean ): string {
	const exactClicks = formatMetricValue( clicks, 'number', { decimals: 0, useMultipliers: false } );

	if ( ! isRateKnown ) {
		return sprintf(
			/* translators: %s: number of email link clicks, e.g. "190". */
			_n(
				'%s click, click rate unknown',
				'%s clicks, click rate unknown',
				clicks,
				'jetpack-premium-analytics-pkg'
			),
			exactClicks
		);
	}

	return sprintf(
		/* translators: 1: number of email link clicks, e.g. "190". 2: click rate, e.g. "5.98%". */
		_n(
			'%1$s click, %2$s click rate',
			'%1$s clicks, %2$s click rate',
			clicks,
			'jetpack-premium-analytics-pkg'
		),
		exactClicks,
		rate
	);
}

function metricValues( row: EmailRow, metric: EmailMetric ) {
	if ( metric === 'clicks' ) {
		const rate = formatEmailRate( row.clicksRate, row.clicks, row.uniqueClicks );
		const isRateKnown = isEmailRateKnown( row.clicks, row.uniqueClicks );
		return {
			count: row.clicks,
			rate,
			description: describeClicks( row.clicks, rate, isRateKnown ),
		};
	}

	const rate = formatEmailRate( row.opensRate, row.opens, row.uniqueOpens );
	const isRateKnown = isEmailRateKnown( row.opens, row.uniqueOpens );
	return { count: row.opens, rate, description: describeOpens( row.opens, rate, isRateKnown ) };
}

/** Render the latest emails with their open or click count and rate. */
export const EmailsList = ( { rows = [], metric = 'opens' }: EmailsListProps ) => {
	const search = useWidgetNavigationSearch( METRIC_SECTION[ metric ] );

	const items: MetricListItem[] = rows.map( row => {
		const { count, rate, description } = metricValues( row, metric );

		return {
			id: row.id,
			label: (
				<PostTitleLink
					id={ row.postId }
					label={ row.label }
					link={ row.link }
					search={ search }
					title={ row.label }
				/>
			),
			value: (
				<>
					<span className={ styles.values } aria-hidden="true">
						<AbbreviatedValue value={ count } dataFormat={ COUNT_FORMAT } />
						<span className={ styles.rate }>{ rate }</span>
					</span>
					<VisuallyHidden render={ <span /> }>{ description }</VisuallyHidden>
				</>
			),
		};
	} );

	return <MetricList className={ styles.list } items={ items } />;
};

/** Normalize and limit the email summary rows. */
function toEmailRows( report: StatsEmailSummary | undefined, max: number ): EmailRow[] {
	const items = report?.data?.[ 0 ]?.items ?? [];

	// `quantity` already bounds the request; this slice is the Stats-widget
	// `max = 0 → all rows` convention and a guard against an over-long response.
	return items.slice( 0, max > 0 ? max : undefined ).map( ( item, index ) => ( {
		id: item.id ?? index,
		postId: item.id,
		link: typeof item.link === 'string' ? item.link : null,
		label: String( item.label ?? '' ),
		opens: item.opens,
		uniqueOpens: item.unique_opens,
		opensRate: item.opens_rate,
		clicks: item.clicks,
		uniqueClicks: item.unique_clicks,
		clicksRate: item.clicks_rate,
	} ) );
}

type EmailsReportProps = {
	attributes?: EmailsAttributes;
};

/** Fetch and render the email summary. */
function EmailsReport( { attributes }: EmailsReportProps ) {
	const metric = attributes?.metric ?? 'opens';

	// The summary endpoint accepts 1–30 rows and silently resets anything outside
	// that range to 10, so the shared limit has to stay inside it.
	const { data, isLoading, isFetching, isError, refetch } = useStatsEmailSummary( {
		quantity: WIDGET_ROW_LIMIT,
	} );

	const rows = useMemo( () => toEmailRows( data, WIDGET_ROW_LIMIT ), [ data ] );

	return (
		<div className={ styles.widget }>
			<div className={ styles.body }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					// `placeholderData` keeps the prior rows on screen, so a transient
					// refetch failure should not replace them with an error.
					isError={ rows.length === 0 && isError }
					isEmpty={ rows.length === 0 }
					error={ {
						description: __(
							"We couldn't load email stats. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					empty={ {
						icon: envelope,
						description: __(
							'Your latest emails will appear here once you send a newsletter.',
							'jetpack-premium-analytics-pkg'
						),
					} }
					renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
				>
					<EmailsList rows={ rows } metric={ metric } />
				</WidgetState>
			</div>
			<WidgetFooter>
				<ReportLink report="emails" />
			</WidgetFooter>
		</div>
	);
}

export default function Emails( { attributes = {} }: EmailsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<EmailsReport attributes={ attributes } />
		</WidgetRoot>
	);
}
