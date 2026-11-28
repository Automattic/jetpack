import { __, sprintf } from '@wordpress/i18n';
import { Badge, Button, Link } from '@wordpress/ui';
import moment from 'moment';
import page from '../../../compat/router';
import { useSelector, getSelectedSiteSlug } from '../../../compat/state';
import { Payment } from '../../../data/promote-post/use-promote-post-payments-query';
import {
	formatCents,
	getAdvertisingDashboardPath,
	getPaymentStatus,
	getPaymentStatusBadgeIntent,
	paymentStatus,
} from '../../utils';

interface Props {
	payment: Payment;
}

/**
 *
 * @param props
 */
export default function PaymentItem( props: Props ) {
	const { payment } = props;
	const siteSlug = useSelector( getSelectedSiteSlug );

	const getReceipt = () => {
		const path = `/payments/receipt/${ payment.id }/${ siteSlug }`;
		page( getAdvertisingDashboardPath( path ) );
	};

	const getActionButton = ( status: Payment[ 'status' ] ) => {
		let actionButton;

		switch ( status ) {
			case paymentStatus.FAILED:
			case paymentStatus.PENDING:
				actionButton = (
					<div className="payment-item__pay-action">
						<Link href={ payment.payment_link } openInNewTab>
							{ __( 'Pay', 'jetpack-blaze' ) }
							<span className="sr-only">
								{ sprintf(
									/* translators: %(name)s is the payment ID. */ __(
										'Pay for %(name)s',
										'jetpack-blaze'
									),
									{ name: String( payment.id ) }
								) }
							</span>
						</Link>
					</div>
				);
				break;

			case paymentStatus.CANCELED:
				actionButton = null;
				break;

			default:
				actionButton = (
					<Button
						variant="minimal"
						size="compact"
						onClick={ getReceipt }
						className="payment-item__view-receipt-action"
					>
						<span aria-hidden="true">{ __( 'Receipt', 'jetpack-blaze' ) }</span>
						<span className="sr-only">
							{ sprintf(
								/* translators: %(name)s is the payment ID. */ __(
									'View receipt for payment %(name)s',
									'jetpack-blaze'
								),
								{ name: String( payment.id ) }
							) }
						</span>
					</Button>
				);
		}
		return actionButton;
	};

	return (
		<tr>
			<td className="payment-item__payment-id">{ payment.id }</td>
			<td className="payment-item__status">
				<Badge intent={ getPaymentStatusBadgeIntent( payment.status ) }>
					{ getPaymentStatus( payment.status ) }
				</Badge>
			</td>
			<td className="payment-item__date">
				{ moment.utc( payment.date ).format( 'MMMM DD, YYYY' ) }
			</td>
			<td className="payment-item__subtotal">{ `$${ formatCents(
				payment.total_with_credits || 0,
				2
			) }` }</td>
			<td className="payment-item__credits">{ `$${ formatCents(
				payment.credits_used || 0,
				2
			) }` }</td>
			<td
				className="payment-item__total"
				style={
					payment.status === paymentStatus.REFUNDED ? { textDecoration: 'line-through' } : undefined
				}
			>
				{ `$${ formatCents( payment.total_paid || 0, 2 ) }` }
			</td>
			<td className="payment-item__actions">{ getActionButton( payment.status ) }</td>
		</tr>
	);
}
