/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Amount from './amount';
import Amounts from './amounts';
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';

const Tab = props => {
	const { activeTab, attributes, setAttributes } = props;
	const {
		currency,
		oneTimeDonation,
		monthlyDonation,
		annualDonation,
		showCustomAmount,
		chooseAmountText,
		customAmountText,
	} = attributes;

	const getDonationAttribute = attributeName => {
		let donation;
		switch ( activeTab ) {
			case 'one-time':
				donation = oneTimeDonation;
				break;
			case '1 month':
				donation = monthlyDonation;
				break;
			case '1 year':
				donation = annualDonation;
				break;
		}

		if ( ! donation ) {
			return null;
		}

		return donation[ attributeName ];
	};

	const setDonationAttribute = ( attributeName, attributeValue ) => {
		switch ( activeTab ) {
			case 'one-time':
				setAttributes( {
					oneTimeDonation: {
						...oneTimeDonation,
						[ attributeName ]: attributeValue,
					},
				} );
				break;
			case '1 month':
				setAttributes( {
					monthlyDonation: {
						...monthlyDonation,
						[ attributeName ]: attributeValue,
					},
				} );
				break;
			case '1 year':
				setAttributes( {
					annualDonation: {
						...annualDonation,
						[ attributeName ]: attributeValue,
					},
				} );
				break;
		}
	};

	return (
		<div className="donations__tab">
			<RichText
				tagName="h4"
				placeholder={ __( 'Write a message…', 'jetpack' ) }
				value={ getDonationAttribute( 'heading' ) }
				onChange={ value => setDonationAttribute( 'heading', value ) }
			/>
			<RichText
				tagName="p"
				placeholder={ __( 'Write a message…', 'jetpack' ) }
				value={ chooseAmountText }
				onChange={ value => setAttributes( { chooseAmountText: value } ) }
			/>
			<Amounts
				amounts={ getDonationAttribute( 'amounts' ) }
				currency={ currency }
				onChange={ amounts => setDonationAttribute( 'amounts', amounts ) }
			/>
			{ showCustomAmount && (
				<>
					<RichText
						tagName="p"
						placeholder={ __( 'Write a message…', 'jetpack' ) }
						value={ customAmountText }
						onChange={ value => setAttributes( { customAmountText: value } ) }
					/>
					<Amount
						currency={ currency }
						label={ __( 'Custom amount', 'jetpack' ) }
						defaultValue={ minimumTransactionAmountForCurrency( currency ) * 100 }
						className="donations__custom-amount"
						disabled={ true }
					/>
				</>
			) }
			<div className="donations__separator">——</div>
			<RichText
				tagName="p"
				placeholder={ __( 'Write a message…', 'jetpack' ) }
				value={ getDonationAttribute( 'extraText' ) }
				onChange={ value => setDonationAttribute( 'extraText', value ) }
			/>
			<div className="wp-block-button donations__donate-button">
				<RichText
					className="wp-block-button__link"
					placeholder={ __( 'Write a message…', 'jetpack' ) }
					value={ getDonationAttribute( 'buttonText' ) }
					onChange={ value => setDonationAttribute( 'buttonText', value ) }
				/>
			</div>
		</div>
	);
};

export default Tab;
