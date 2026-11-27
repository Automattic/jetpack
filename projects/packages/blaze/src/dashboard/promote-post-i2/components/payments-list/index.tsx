import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Notice, Spinner } from '@wordpress/ui';
import { CALYPSO_CONTACT } from '../../../compat/utils';
import { Payment } from '../../../data/promote-post/use-promote-post-payments-query';
import { DSPMessage } from '../../main';
import EmptyPromotionList from '../empty-promotion-list';
import PaymentItem from '../payment-item';
import PaymentsFilter from '../payments-filter';
import { DropdownOption } from '../search-bar';
import './style.scss';

type Props = {
	isLoading: boolean;
	isFetching: boolean;
	isError: DSPMessage | null;
	payments?: Payment[];
	selectedPaymentsFilter: boolean;
	setFetchPaymentsForCurrentSite: ( flag: boolean ) => void;
};

const fetchErrorListMessage = () =>
	createInterpolateElement(
		/* translators: Validation error fetching payment info */ __(
			'There was a problem obtaining the payments list. Please try again or <contactSupportLink>contact support</contactSupportLink>.',
			'jetpack-blaze'
		),
		{
			contactSupportLink: <Link href={ CALYPSO_CONTACT } />,
		}
	);

/**
 *
 * @param props
 */
export default function PaymentsList( props: Props ) {
	const {
		isLoading,
		isFetching,
		isError,
		payments,
		selectedPaymentsFilter,
		setFetchPaymentsForCurrentSite,
	} = props;

	type PaymentColumn = {
		key: string;
		title: string;
	};

	const getHeaderColumns = (): PaymentColumn[] => {
		return [
			{
				key: 'payment-id',
				title: __( 'Payment', 'jetpack-blaze' ),
			},
			{
				key: 'status',
				title: __( 'Status', 'jetpack-blaze' ),
			},
			{
				key: 'date',
				title: __( 'Date issued', 'jetpack-blaze' ),
			},
			{
				key: 'subtotal',
				title: __( 'Subtotal', 'jetpack-blaze' ),
			},
			{
				key: 'credits',
				title: __( 'Credits', 'jetpack-blaze' ),
			},
			{
				key: 'total',
				title: __( 'Total paid', 'jetpack-blaze' ),
			},
			{
				key: 'actions',
				title: '',
			},
		];
	};

	const paymentFilterOptions: Array< DropdownOption > = [
		{
			value: 'currentSite',
			label: __( 'Current site', 'jetpack-blaze' ),
		},
		{
			value: 'unified',
			label: __( 'All Sites', 'jetpack-blaze' ),
		},
	];

	if ( isError ) {
		return (
			<Notice.Root intent="error" className="promote-post-notice promote-post-i2__aux-wrapper">
				<Notice.Description>{ fetchErrorListMessage() }</Notice.Description>
			</Notice.Root>
		);
	}

	return (
		<>
			<PaymentsFilter
				options={ paymentFilterOptions }
				paymentsFilter={ selectedPaymentsFilter ? 'currentSite' : 'unified' }
				handleChangeFilter={ event => {
					setFetchPaymentsForCurrentSite( event );
				} }
			/>
			{ ! isLoading && payments?.length === 0 ? (
				<div className="promote-post-i2__aux-wrapper">
					<EmptyPromotionList type="payments" />
				</div>
			) : (
				<>
					{ isFetching ? (
						<div className="promote-post-i2__aux-wrapper">
							<div className="payments-list__loading">
								<Spinner />
								<p>{ __( 'Please wait. Loading payments.', 'jetpack-blaze' ) }</p>
							</div>
						</div>
					) : (
						<>
							{ selectedPaymentsFilter && (
								<div className="promote-post-i2__aux-wrapper">
									<p className="payments-list__info">
										{ __(
											'If you share the payment method across multiple sites, you may see a cost breakdown for those here too.',
											'jetpack-blaze'
										) }
									</p>
								</div>
							) }
							<div className="promote-post-i2__table payments-list__table">
								<table>
									<thead>
										<tr>
											{ getHeaderColumns().map( ( item, key ) => (
												<th className={ `payment-item__${ item.key }` } key={ key }>
													{ item.title }
												</th>
											) ) }
										</tr>
									</thead>
									<tbody>
										{ payments?.map( payment => (
											<PaymentItem payment={ payment } key={ payment.id } />
										) ) }
									</tbody>
								</table>
							</div>
						</>
					) }
				</>
			) }
		</>
	);
}
