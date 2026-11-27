import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import moment from 'moment';
import { OrderInfo } from '../../../data/promote-post/use-promote-post-billing-summary-query';
import { formatNumber } from '../../utils';

import './style.scss';

interface Props {
	payment_links: OrderInfo[];
}

/**
 *
 * @param props
 */
export default function PaymentLinks( props: Props ) {
	const { payment_links } = props;
	return (
		<div className="promoted-posts__payment-links-container">
			<div className="promoted-posts__payment-links">
				<div className="promoted-posts__payment-link-row">
					<div className="payment-link__label">{ __( 'Date', 'jetpack-blaze' ) }</div>
					<div className="payment-link__label">{ __( 'Amount', 'jetpack-blaze' ) }</div>
					<div>&nbsp;</div>
				</div>
				{ payment_links.map( ( info, index ) => (
					<div key={ index } className="promoted-posts__payment-link-row">
						<div>{ moment( info.date ).format( 'MMMM DD, YYYY' ) }</div>
						<div>${ formatNumber( info.amount ) }</div>
						<div className="payment-link__link">
							<Link href={ info.url } openInNewTab>
								{ __( 'Pay', 'jetpack-blaze' ) }
							</Link>
						</div>
					</div>
				) ) }
			</div>
		</div>
	);
}
