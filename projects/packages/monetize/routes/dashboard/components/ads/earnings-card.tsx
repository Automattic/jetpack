import { formatCurrency, formatNumber } from '@automattic/number-formatters';
import { __, _x } from '@wordpress/i18n';
import { Card, Notice, Skeleton, Stack, Text } from '@wordpress/ui';
import type { AdsEarnings, EarningStatus, EarningsPeriod } from '../../data/wordads';
import type { WpcomApiError } from '../../data/wpcom-request';

// WordPress.com pays ad earnings in US dollars only.
const CURRENCY = 'USD';

const STATUS_LABELS: Record< EarningStatus, () => string > = {
	unpaid: () => __( 'Unpaid', 'jetpack-monetize' ),
	paid: () => __( 'Paid', 'jetpack-monetize' ),
	internal: () => __( 'Internal', 'jetpack-monetize' ),
	'missing-tax-info': () => __( 'Pending (missing tax info)', 'jetpack-monetize' ),
	'invalid-paypal': () => __( 'Pending (invalid PayPal)', 'jetpack-monetize' ),
};

/**
 * The label for a month's payout state.
 *
 * @param status - The state.
 * @return The label.
 */
export function getStatusLabel( status: EarningStatus | null ) {
	return status ? STATUS_LABELS[ status ]() : '?';
}

const PERIOD_FORMAT = new Intl.DateTimeFormat( undefined, {
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC',
} );

/**
 * A `YYYY-MM` month in the reader's locale, e.g. `October 2026`.
 *
 * @param period - The month.
 * @return The label, or the month as given if it isn't `YYYY-MM`.
 */
export function formatPeriod( period: string ) {
	const match = /^(\d{4})-(\d{2})$/.exec( period );
	return match
		? PERIOD_FORMAT.format( Date.UTC( Number( match[ 1 ] ), Number( match[ 2 ] ) - 1 ) )
		: period;
}

/**
 * One kind of earnings, a row per month.
 *
 * @param props         - Component props.
 * @param props.title   - The table's heading.
 * @param props.periods - The months.
 * @return The table.
 */
function HistoryTable( { title, periods }: { title: string; periods: EarningsPeriod[] } ) {
	const showAdsServed = periods.some( ( { adsServed } ) => adsServed !== null );

	return (
		<Stack direction="column" gap="sm">
			<Text variant="heading-sm" render={ <h3 /> }>
				{ title }
			</Text>
			<div className="jp-monetize-ads__table-scroll">
				<table className="jp-monetize-ads__table">
					<thead>
						<tr>
							<th scope="col">{ __( 'Period', 'jetpack-monetize' ) }</th>
							<th scope="col">{ __( 'Earnings', 'jetpack-monetize' ) }</th>
							{ showAdsServed && <th scope="col">{ __( 'Ads served', 'jetpack-monetize' ) }</th> }
							<th scope="col">{ __( 'Status', 'jetpack-monetize' ) }</th>
						</tr>
					</thead>
					<tbody>
						{ periods.map( ( { period, amount, adsServed, status } ) => (
							<tr key={ period }>
								<td>{ formatPeriod( period ) }</td>
								<td>{ formatCurrency( amount, CURRENCY ) }</td>
								{ showAdsServed && (
									<td>{ adsServed === null ? '' : formatNumber( adsServed ) }</td>
								) }
								<td>{ getStatusLabel( status ) }</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		</Stack>
	);
}

/**
 * What the site has earned from ads, with the monthly history.
 *
 * @param props          - Component props.
 * @param props.earnings - The earnings, once loaded.
 * @param props.error    - Why they didn't load.
 * @return The card.
 */
export default function EarningsCard( {
	earnings,
	error,
}: {
	earnings?: AdsEarnings;
	error?: WpcomApiError | null;
} ) {
	const figures = [
		{
			label: _x( 'Total earnings', 'Sum of earnings', 'jetpack-monetize' ),
			value: earnings?.total,
		},
		{
			label: _x( 'Total paid', 'Sum of earnings that have been paid out', 'jetpack-monetize' ),
			value: earnings && earnings.total - earnings.owed,
		},
		{
			label: _x( 'Outstanding amount', 'Sum of earnings not yet paid', 'jetpack-monetize' ),
			value: earnings?.owed,
		},
	];

	const tables = earnings
		? [
				{ title: __( 'Earnings history', 'jetpack-monetize' ), periods: earnings.wordads },
				{
					title: __( 'Sponsored content history', 'jetpack-monetize' ),
					periods: earnings.sponsored,
				},
				{ title: __( 'Adjustments history', 'jetpack-monetize' ), periods: earnings.adjustment },
			].filter( ( { periods } ) => periods.length > 0 )
		: [];

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Ad earnings', 'jetpack-monetize' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ error ? (
					<Notice.Root intent="error">
						<Notice.Description>
							{ error.message ||
								__(
									'Your ad earnings could not be loaded. Please try again.',
									'jetpack-monetize'
								) }
						</Notice.Description>
					</Notice.Root>
				) : (
					<Stack direction="column" gap="xl">
						<div className="jp-monetize-ads__figures">
							{ figures.map( ( { label, value } ) => (
								<Stack key={ label } direction="column" gap="xs">
									<Text variant="body-sm">{ label }</Text>
									{ earnings ? (
										<Text variant="heading-xl">{ formatCurrency( value ?? 0, CURRENCY ) }</Text>
									) : (
										<Skeleton className="jp-monetize-ads__figure-placeholder" />
									) }
								</Stack>
							) ) }
						</div>
						{ tables.map( table => (
							<HistoryTable key={ table.title } { ...table } />
						) ) }
						{ earnings && earnings.wordads.length > 0 && (
							<Text variant="body-sm">
								{ __(
									'Ads served is the number of ads we tried to show (page views × ad slots). Not every ad served is paid: visitors may block ads or leave before they load, or no advertiser may bid above the minimum price.',
									'jetpack-monetize'
								) }
							</Text>
						) }
					</Stack>
				) }
			</Card.Content>
		</Card.Root>
	);
}
