/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/route';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { StatsEmailSummaryItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

/**
 * Format a count for display.
 *
 * @param value - The value to format.
 * @return The formatted number.
 */
function formatNumber( value: number ): string {
	return formatMetricValue( value, 'number', { decimals: 0, useMultipliers: false } );
}

/**
 * Format a rate for display. The summary endpoint reports rates as 0–100
 * percentages (unlike the per-post rate breakdown's 0–1 fractions), so the
 * value is scaled back to a fraction for `percentage` formatting, which
 * supplies a locale-correct percent sign.
 *
 * Rates count *unique* recipients against sends. When events exist but none
 * could be attributed to a recipient (e.g. link-scanner or view-in-browser
 * clicks: `total > 0` with `unique === 0`), a literal `0%` would misread as
 * "the clicks were ignored" — render an em dash instead, mirroring the legacy
 * Emails module's not-attributable fallback.
 *
 * @param rate   - The 0–100 rate.
 * @param total  - Total event count.
 * @param unique - Unique (attributed) event count.
 * @return The formatted percentage, or an em dash when not attributable.
 */
function formatRate( rate: number, total: number, unique: number ): string {
	if ( total > 0 && unique === 0 ) {
		return '—';
	}

	// `signDisplay` is forced to `auto` so a rate is not rendered as `+12%`.
	return formatMetricValue( rate / 100, 'percentage', { decimals: 2, signDisplay: 'auto' } );
}

/**
 * Format the sent date for display, tolerating a missing or malformed value.
 *
 * @param value - The raw `date` from the summary row.
 * @return The formatted date, or an em dash placeholder.
 */
function formatSentDate( value: unknown ): string {
	const date = new Date( String( value ?? '' ) );

	return Number.isNaN( date.getTime() )
		? '—'
		: date.toLocaleDateString( undefined, { year: 'numeric', month: 'short', day: 'numeric' } );
}

/**
 * The display title for an email summary row, tolerating a non-string label.
 *
 * @param item - The email summary row.
 * @return The display title.
 */
function emailTitle( item: StatsEmailSummaryItem ): string {
	return typeof item.label === 'string' ? item.label : String( item.label ?? '' );
}

/**
 * Render the title cell: an internal link into the post detail page's Email
 * opens tab (emails are posts; `post_id` is the shared key). The search
 * updater preserves the shared report params already in the URL.
 *
 * @param props      - Component props.
 * @param props.item - The email summary row.
 * @return The title cell.
 */
function EmailTitle( { item }: { item: StatsEmailSummaryItem } ) {
	const title = emailTitle( item );

	if ( item.id === undefined || item.id === null ) {
		return (
			<span title={ title } className={ styles.title }>
				{ title }
			</span>
		);
	}

	return (
		<Link
			to="/post/$postId"
			params={ { postId: String( item.id ) } as unknown as never }
			search={
				( ( current: Record< string, unknown > ) => ( {
					...current,
					section: 'email-opens',
				} ) ) as unknown as never
			}
			title={ title }
			className={ styles.title }
		>
			{ title }
		</Link>
	);
}

/**
 * DataViews field config for the Emails records table.
 *
 * @return The field config.
 */
export function getEmailsFields(): Field< StatsEmailSummaryItem >[] {
	return [
		{
			id: 'label',
			label: __( 'Email', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => emailTitle( item ),
			render: ( { item } ) => <EmailTitle item={ item } />,
		},
		{
			id: 'date',
			label: __( 'Sent', 'jetpack-premium-analytics-pkg' ),
			// ISO date strings sort correctly as plain strings.
			getValue: ( { item } ) => String( item.date ?? '' ),
			render: ( { item } ) => <>{ formatSentDate( item.date ) }</>,
		},
		{
			id: 'opens',
			label: __( 'Opens', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.opens,
			render: ( { item } ) => <>{ formatNumber( item.opens ) }</>,
		},
		{
			id: 'opens_rate',
			label: __( 'Open rate', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.opens_rate,
			render: ( { item } ) => <>{ formatRate( item.opens_rate, item.opens, item.unique_opens ) }</>,
		},
		{
			id: 'clicks',
			label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.clicks,
			render: ( { item } ) => <>{ formatNumber( item.clicks ) }</>,
		},
		{
			id: 'clicks_rate',
			label: __( 'Click rate', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.clicks_rate,
			render: ( { item } ) => (
				<>{ formatRate( item.clicks_rate, item.clicks, item.unique_clicks ) }</>
			),
		},
	];
}
