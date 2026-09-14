/**
 * External dependencies
 */
import { useStatsEmailSummary, type StatsEmailSummary } from '@jetpack-premium-analytics/data';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	LeaderboardSkeleton,
	MetricList,
	PostTitleLink,
	ReportLink,
	WIDGET_ROW_LIMIT,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	useWidgetNavigationSearch,
	type MetricListItem,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
	/** Open rate from 0 to 100. */
	opensRate: number;
	/** Click rate from 0 to 100. */
	clicksRate: number;
};

const METRIC_SECTION: Record< EmailMetric, string > = {
	opens: 'email-opens',
	clicks: 'email-clicks',
};

type EmailsListProps = {
	/** Email rows to render. */
	rows?: EmailRow[];
	/** Rate to display. */
	metric?: EmailMetric;
};

/** Render the latest emails with their open or click rate. */
export const EmailsList = ( { rows = [], metric = 'opens' }: EmailsListProps ) => {
	const search = useWidgetNavigationSearch( METRIC_SECTION[ metric ] );

	const items: MetricListItem[] = rows.map( row => {
		const rate = metric === 'clicks' ? row.clicksRate : row.opensRate;

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
			value: formatMetricValue( rate / 100, 'percentage', {
				decimals: 2,
				signDisplay: 'never',
			} ),
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
		opensRate: item.opens_rate,
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
