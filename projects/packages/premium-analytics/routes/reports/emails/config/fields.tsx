/**
 * External dependencies
 */
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
	return value.toLocaleString();
}

/**
 * Format a rate for display. The summary endpoint reports rates as 0–100
 * percentages (unlike the per-post rate breakdown's 0–1 fractions) — Calypso's
 * Emails module renders `formatNumber( item.opens_rate )%` — so the value only
 * needs a `%` suffix.
 *
 * @param value - The 0–100 rate.
 * @return The formatted percentage.
 */
function formatRate( value: number ): string {
	return `${ value.toLocaleString( undefined, { maximumFractionDigits: 2 } ) }%`;
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
			label: __( 'Email', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => emailTitle( item ),
			render: ( { item } ) => <EmailTitle item={ item } />,
		},
		{
			id: 'date',
			label: __( 'Sent', 'jetpack-premium-analytics' ),
			// ISO date strings sort correctly as plain strings.
			getValue: ( { item } ) => String( item.date ?? '' ),
			render: ( { item } ) => <>{ formatSentDate( item.date ) }</>,
		},
		{
			id: 'opens',
			label: __( 'Opens', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.opens,
			render: ( { item } ) => <>{ formatNumber( item.opens ) }</>,
		},
		{
			id: 'opens_rate',
			label: __( 'Open rate', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.opens_rate,
			render: ( { item } ) => <>{ formatRate( item.opens_rate ) }</>,
		},
		{
			id: 'clicks',
			label: __( 'Clicks', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.clicks,
			render: ( { item } ) => <>{ formatNumber( item.clicks ) }</>,
		},
		{
			id: 'clicks_rate',
			label: __( 'Click rate', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.clicks_rate,
			render: ( { item } ) => <>{ formatRate( item.clicks_rate ) }</>,
		},
	];
}
