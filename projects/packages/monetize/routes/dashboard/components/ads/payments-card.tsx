import { formatCurrency } from '@automattic/number-formatters';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Card, Notice, Stack, Text } from '@wordpress/ui';
import { useAdsPayments } from '../../data/wordads';
import type { AdsPayment } from '../../data/wordads';
import type { ComponentProps } from 'react';

type BadgeIntent = ComponentProps< typeof Badge >[ 'intent' ];

const STATUS_INTENTS: Record< string, BadgeIntent > = {
	paid: 'stable',
	pending: 'informational',
	failed: 'high',
};

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
		content = <Text>{ __( 'Loading…', 'jetpack-monetize' ) }</Text>;
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
				<div className="jp-monetize-ads__table-scroll">
					<table className="jp-monetize-ads__table">
						<thead>
							<tr>
								<th scope="col">{ __( 'Date', 'jetpack-monetize' ) }</th>
								<th scope="col">{ __( 'Amount', 'jetpack-monetize' ) }</th>
								<th scope="col">{ __( 'Status', 'jetpack-monetize' ) }</th>
								<th scope="col">{ __( 'PayPal', 'jetpack-monetize' ) }</th>
								<th scope="col">{ __( 'Description', 'jetpack-monetize' ) }</th>
							</tr>
						</thead>
						<tbody>
							{ payments.map( payment => (
								<tr key={ payment.id }>
									<td>
										{ payment.status === 'pending'
											? sprintf(
													/* translators: %s: the date a payout is expected. */
													__( 'Estimated: %s', 'jetpack-monetize' ),
													payment.date
												)
											: payment.date }
									</td>
									<td>{ formatCurrency( payment.amount, 'USD' ) }</td>
									<td>
										<Badge intent={ STATUS_INTENTS[ payment.status ] ?? 'medium' }>
											{ payment.status }
										</Badge>
									</td>
									<td>{ payment.paypalEmail }</td>
									<td>{ payment.description }</td>
								</tr>
							) ) }
						</tbody>
					</table>
				</div>
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Payouts', 'jetpack-monetize' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
		</Card.Root>
	);
}
