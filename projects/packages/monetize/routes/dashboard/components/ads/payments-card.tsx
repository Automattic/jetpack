import { formatCurrency } from '@automattic/number-formatters';
import { dateI18n, getSettings } from '@wordpress/date';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Badge, Card, Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { useMemo } from 'react';
import { useAdsPayments } from '../../data/wordads';
import DataTable from './data-table';
import type { AdsPayment } from '../../data/wordads';
import type { Field } from '@wordpress/dataviews';
import type { ComponentProps } from 'react';

type BadgeIntent = ComponentProps< typeof Badge >[ 'intent' ];

const STATUS_INTENTS: Record< string, BadgeIntent > = {
	paid: 'stable',
	pending: 'informational',
	failed: 'high',
};

const STATUS_LABELS: Record< string, () => string > = {
	paid: () => _x( 'Paid', 'payout status', 'jetpack-monetize' ),
	pending: () => _x( 'Pending', 'payout status', 'jetpack-monetize' ),
	failed: () => _x( 'Failed', 'payout status', 'jetpack-monetize' ),
};

/**
 * A payout's date in the site's date format, or its estimate while pending.
 *
 * @param payment - The payout.
 * @return The label.
 */
export function formatPaymentDate( payment: AdsPayment ) {
	const { date, status } = payment;
	const formatted = /^\d{4}-\d{2}-\d{2}$/.test( date )
		? dateI18n( getSettings().formats.date, `${ date }T00:00:00Z`, true )
		: date;
	return status === 'pending'
		? sprintf(
				/* translators: %s: the date a payout is expected. */
				__( 'Estimated: %s', 'jetpack-monetize' ),
				formatted
			)
		: formatted;
}

/**
 * The payouts table's columns.
 *
 * @return The fields.
 */
function getPaymentFields(): Field< AdsPayment >[] {
	return [
		{
			id: 'date',
			label: __( 'Date', 'jetpack-monetize' ),
			getValue: ( { item } ) => formatPaymentDate( item ),
		},
		{
			id: 'amount',
			label: __( 'Amount', 'jetpack-monetize' ),
			getValue: ( { item } ) => formatCurrency( item.amount, 'USD' ),
		},
		{
			id: 'status',
			label: __( 'Status', 'jetpack-monetize' ),
			getValue: ( { item } ) => STATUS_LABELS[ item.status ]?.() ?? item.status,
			render: ( { item } ) => (
				<Badge intent={ STATUS_INTENTS[ item.status ] ?? 'medium' }>
					{ STATUS_LABELS[ item.status ]?.() ?? item.status }
				</Badge>
			),
		},
		{ id: 'paypalEmail', label: __( 'PayPal', 'jetpack-monetize' ) },
		{ id: 'description', label: __( 'Description', 'jetpack-monetize' ) },
	];
}

const getPaymentId = ( { id }: AdsPayment ) => String( id );

/**
 * Whether a pending payout goes to an address other than the current one.
 *
 * @param payments - The payouts.
 * @param paypal   - The PayPal address on file.
 * @return Whether one does.
 */
export function hasPendingMismatch( payments: AdsPayment[], paypal: string ) {
	return (
		paypal !== '' &&
		payments.some( payment => payment.status === 'pending' && payment.paypalEmail !== paypal )
	);
}

/**
 * The site's ad payouts.
 *
 * @param props        - Component props.
 * @param props.paypal - The PayPal address on file, once loaded.
 * @return The card.
 */
export default function PaymentsCard( { paypal }: { paypal?: string } ) {
	const { data: payments, isError, error } = useAdsPayments();
	const fields = useMemo( getPaymentFields, [] );

	let content;
	if ( isError ) {
		content = (
			<Notice.Root intent="error">
				<Notice.Description>
					{ error.message ||
						__( 'Your ad payouts could not be loaded. Please try again.', 'jetpack-monetize' ) }
				</Notice.Description>
			</Notice.Root>
		);
	} else if ( ! payments ) {
		content = (
			<Stack direction="row" justify="center" className="jp-monetize-loading">
				<Spinner />
			</Stack>
		);
	} else if ( payments.length === 0 ) {
		content = (
			<Text>
				{ __(
					'No payouts yet. You’re paid once your outstanding earnings reach $100.',
					'jetpack-monetize'
				) }
			</Text>
		);
	} else {
		content = (
			<Stack direction="column" gap="lg">
				{ paypal !== undefined && hasPendingMismatch( payments, paypal ) && (
					<Notice.Root intent="warning">
						<Notice.Description>
							{ __(
								'Your pending payout will go to a PayPal address other than your current one. Contact support if you need to change it.',
								'jetpack-monetize'
							) }
						</Notice.Description>
					</Notice.Root>
				) }
				<DataTable data={ payments } fields={ fields } getItemId={ getPaymentId } />
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Payout history', 'jetpack-monetize' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
		</Card.Root>
	);
}
