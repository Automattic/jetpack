import formatCurrency, { CURRENCIES } from '@automattic/format-currency';
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { minimumTransactionAmountForCurrency } from '../../../../shared/currencies';

export default {
	attributes: {
		currency: {
			type: 'string',
			default: 'USD',
		},
		oneTimeDonation: {
			type: 'object',
			default: {
				show: true,
				planId: null,
				amounts: [ 5, 15, 100 ],
				heading: __( 'Make a one-time donation', 'jetpack' ),
				extraText: __( 'Your contribution is appreciated.', 'jetpack' ),
				buttonText: __( 'Donate', 'jetpack' ),
			},
		},
		monthlyDonation: {
			type: 'object',
			default: {
				show: true,
				planId: null,
				amounts: [ 5, 15, 100 ],
				heading: __( 'Make a monthly donation', 'jetpack' ),
				extraText: __( 'Your contribution is appreciated.', 'jetpack' ),
				buttonText: __( 'Donate monthly', 'jetpack' ),
			},
		},
		annualDonation: {
			type: 'object',
			default: {
				show: true,
				planId: null,
				amounts: [ 5, 15, 100 ],
				heading: __( 'Make a yearly donation', 'jetpack' ),
				extraText: __( 'Your contribution is appreciated.', 'jetpack' ),
				buttonText: __( 'Donate yearly', 'jetpack' ),
			},
		},
		showCustomAmount: {
			type: 'boolean',
			default: true,
		},
		chooseAmountText: {
			type: 'string',
			default: __( 'Choose an amount', 'jetpack' ),
		},
		customAmountText: {
			type: 'string',
			default: __( 'Or enter a custom amount', 'jetpack' ),
		},
	},
	supports: {
		html: false,
	},
	save: ( { attributes } ) => {
		const {
			currency,
			oneTimeDonation,
			monthlyDonation,
			annualDonation,
			showCustomAmount,
			chooseAmountText,
			customAmountText,
		} = attributes;

		if ( ! oneTimeDonation || ! oneTimeDonation.show || oneTimeDonation.planId === -1 ) {
			return null;
		}

		const tabs = {
			'one-time': { title: __( 'One-Time', 'jetpack' ) },
			...( monthlyDonation.show && { '1 month': { title: __( 'Monthly', 'jetpack' ) } } ),
			...( annualDonation.show && { '1 year': { title: __( 'Yearly', 'jetpack' ) } } ),
		};

		return (
			<div>
				<div className="donations__container">
					{ Object.keys( tabs ).length > 1 && (
						<div className="donations__nav">
							{ Object.entries( tabs ).map( ( [ interval, { title } ] ) => (
								<div
									role="button"
									tabIndex={ 0 }
									className="donations__nav-item"
									key={ `jetpack-donations-nav-item-${ interval } ` }
									data-interval={ interval }
								>
									{ title }
								</div>
							) ) }
						</div>
					) }
					<div className="donations__content">
						<div className="donations__tab">
							<RichText.Content
								tagName="h4"
								className="donations__one-time-item"
								value={ oneTimeDonation.heading }
							/>
							{ monthlyDonation.show && (
								<RichText.Content
									tagName="h4"
									className="donations__monthly-item"
									value={ monthlyDonation.heading }
								/>
							) }
							{ annualDonation.show && (
								<RichText.Content
									tagName="h4"
									className="donations__annual-item"
									value={ annualDonation.heading }
								/>
							) }
							<RichText.Content tagName="p" value={ chooseAmountText } />
							<div className="donations__amounts donations__one-time-item">
								{ oneTimeDonation.amounts.map( amount => (
									<div className="donations__amount" data-amount={ amount }>
										{ formatCurrency( amount, currency ) }
									</div>
								) ) }
							</div>
							{ monthlyDonation.show && (
								<div className="donations__amounts donations__monthly-item">
									{ monthlyDonation.amounts.map( amount => (
										<div className="donations__amount" data-amount={ amount }>
											{ formatCurrency( amount, currency ) }
										</div>
									) ) }
								</div>
							) }
							{ annualDonation.show && (
								<div className="donations__amounts donations__annual-item">
									{ annualDonation.amounts.map( amount => (
										<div className="donations__amount" data-amount={ amount }>
											{ formatCurrency( amount, currency ) }
										</div>
									) ) }
								</div>
							) }
							{ showCustomAmount && (
								<>
									<RichText.Content tagName="p" value={ customAmountText } />
									<div className="donations__amount donations__custom-amount">
										{ CURRENCIES[ currency ].symbol }
										<div
											className="donations__amount-value"
											data-currency={ currency }
											data-empty-text={ formatCurrency(
												minimumTransactionAmountForCurrency( currency ) * 100,
												currency,
												{ symbol: '' }
											) }
										/>
									</div>
								</>
							) }
							<div className="donations__separator">——</div>
							<RichText.Content
								tagName="p"
								className="donations__one-time-item"
								value={ oneTimeDonation.extraText }
							/>
							{ monthlyDonation.show && (
								<RichText.Content
									tagName="p"
									className="donations__monthly-item"
									value={ monthlyDonation.extraText }
								/>
							) }
							{ annualDonation.show && (
								<RichText.Content
									tagName="p"
									className="donations__annual-item"
									value={ annualDonation.extraText }
								/>
							) }
							<div className="wp-block-button donations__donate-button-wrapper donations__one-time-item">
								<RichText.Content
									tagName="a"
									className="wp-block-button__link donations__donate-button donations__one-time-item"
									value={ oneTimeDonation.buttonText }
								/>
							</div>
							{ monthlyDonation.show && (
								<div className="wp-block-button donations__donate-button-wrapper donations__monthly-item">
									<RichText.Content
										tagName="a"
										className="wp-block-button__link donations__donate-button donations__monthly-item"
										value={ monthlyDonation.buttonText }
									/>
								</div>
							) }
							{ annualDonation.show && (
								<div className="wp-block-button donations__donate-button-wrapper donations__annual-item">
									<RichText.Content
										tagName="a"
										className="wp-block-button__link donations__donate-button donations__annual-item"
										value={ annualDonation.buttonText }
									/>
								</div>
							) }
						</div>
					</div>
				</div>
			</div>
		);
	},
};
