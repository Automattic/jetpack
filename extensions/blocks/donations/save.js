/**
 * External dependencies
 */
import formatCurrency, { CURRENCIES } from '@automattic/format-currency';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';

const Save = ( { attributes } ) => {
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
							<Button
								className="donations__nav-item"
								key={ `jetpack-donations-nav-item-${ interval } ` }
								data-interval={ interval }
							>
								{ title }
							</Button>
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
						<div className="wp-block-buttons donations__amounts donations__one-time-item">
							{ oneTimeDonation.amounts.map( amount => (
								<div
									className="wp-block-button donations__amount"
									data-interval="one-time"
									data-amount={ amount }
								>
									<div className="wp-block-button__link">
										{ CURRENCIES[ currency ].symbol }
										<span className="donations__amount-value">
											{ formatCurrency( amount, currency, { symbol: '' } ) }
										</span>
									</div>
								</div>
							) ) }
						</div>
						{ monthlyDonation.show && (
							<div className="wp-block-buttons donations__amounts donations__monthly-item">
								{ monthlyDonation.amounts.map( amount => (
									<div
										className="wp-block-button donations__amount"
										data-interval="1 month"
										data-amount={ amount }
									>
										<div className="wp-block-button__link">
											{ CURRENCIES[ currency ].symbol }
											<span className="donations__amount-value">
												{ formatCurrency( amount, currency, { symbol: '' } ) }
											</span>
										</div>
									</div>
								) ) }
							</div>
						) }
						{ annualDonation.show && (
							<div className="wp-block-buttons donations__amounts donations__annual-item">
								{ annualDonation.amounts.map( amount => (
									<div
										className="wp-block-button donations__amount"
										data-interval="1 year"
										data-amount={ amount }
									>
										<div className="wp-block-button__link">
											{ CURRENCIES[ currency ].symbol }
											<span className="donations__amount-value">
												{ formatCurrency( amount, currency, { symbol: '' } ) }
											</span>
										</div>
									</div>
								) ) }
							</div>
						) }
						{ showCustomAmount && (
							<>
								<RichText.Content tagName="p" value={ customAmountText } />
								<div className="wp-block-button donations__amount donations__custom-amount">
									<div className="wp-block-button__link">
										{ CURRENCIES[ currency ].symbol }
										<span className="donations__amount-value">
											{ formatCurrency(
												minimumTransactionAmountForCurrency( currency ) * 100,
												currency,
												{ symbol: '' }
											) }
										</span>
									</div>
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
						<div className="wp-block-button donations__donate-button donations__one-time-item">
							<RichText.Content
								tagName="button"
								className="wp-block-button__link"
								value={ oneTimeDonation.buttonText }
							/>
						</div>
						{ monthlyDonation.show && (
							<div className="wp-block-button donations__donate-button donations__monthly-item">
								<RichText.Content
									tagName="button"
									className="wp-block-button__link"
									value={ monthlyDonation.buttonText }
								/>
							</div>
						) }
						{ annualDonation.show && (
							<div className="wp-block-button donations__donate-button donations__annual-item">
								<RichText.Content
									tagName="button"
									className="wp-block-button__link"
									value={ annualDonation.buttonText }
								/>
							</div>
						) }
					</div>
				</div>
			</div>
		</div>
	);
};

export default Save;
