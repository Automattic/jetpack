/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Amount from './amount';
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';

const Tab = ( { activeTab, attributes, setAttributes } ) => {
	const {
		currency,
		oneTimeDonation,
		monthlyDonation,
		annualDonation,
		showCustomAmount,
		chooseAmountText,
		customAmountText,
	} = attributes;

	const [ previousCurrency, setPreviousCurrency ] = useState( currency );
	const minAmount = minimumTransactionAmountForCurrency( currency );
	const [ defaultAmounts, setDefaultAmounts ] = useState( [
		minAmount * 10, // 1st tier (USD 5)
		minAmount * 30, // 2nd tier (USD 15)
		minAmount * 200, // 3rd tier (USD 100)
	] );

	const donationAttributes = {
		'one-time': 'oneTimeDonation',
		'1 month': 'monthlyDonation',
		'1 year': 'annualDonation',
	};

	const getDonationValue = key => attributes[ donationAttributes[ activeTab ] ][ key ];

	const setDonationValue = ( key, value ) => {
		const donationAttribute = donationAttributes[ activeTab ];
		const donation = attributes[ donationAttribute ];
		setAttributes( {
			[ donationAttribute ]: {
				...donation,
				[ key ]: value,
			},
		} );
	};

	const amounts = getDonationValue( 'amounts' );

	const setAmount = ( amount, tier ) => {
		const newAmounts = [ ...amounts ];
		newAmounts[ tier ] = amount;
		setDonationValue( 'amounts', newAmounts );
	};

	// Updates the amounts whenever there are new defaults due to a currency change.
	useEffect( () => {
		if ( previousCurrency === currency ) {
			return;
		}
		setPreviousCurrency( currency );

		const newDefaultAmounts = [
			minAmount * 10, // 1st tier (USD 5)
			minAmount * 30, // 2nd tier (USD 15)
			minAmount * 200, // 3rd tier (USD 100)
		];
		setDefaultAmounts( newDefaultAmounts );
		setAttributes( {
			oneTimeDonation: { ...oneTimeDonation, amounts: newDefaultAmounts },
			monthlyDonation: { ...monthlyDonation, amounts: newDefaultAmounts },
			annualDonation: { ...annualDonation, amounts: newDefaultAmounts },
		} );
	}, [
		currency,
		previousCurrency,
		minAmount,
		oneTimeDonation,
		monthlyDonation,
		annualDonation,
		setAttributes,
	] );

	return (
		<div className="donations__tab">
			<RichText
				tagName="h4"
				placeholder={ __( 'Write a message…', 'jetpack' ) }
				value={ getDonationValue( 'heading' ) }
				onChange={ value => setDonationValue( 'heading', value ) }
			/>
			<RichText
				tagName="p"
				placeholder={ __( 'Write a message…', 'jetpack' ) }
				value={ chooseAmountText }
				onChange={ value => setAttributes( { chooseAmountText: value } ) }
			/>
			<div className="wp-block-buttons donations__amounts">
				{ amounts.map( ( amount, index ) => (
					<Amount
						currency={ currency }
						defaultValue={ defaultAmounts[ index ] }
						label={ sprintf(
							// translators: %d: Tier level e.g: "1", "2", "3"
							__( 'Tier %d', 'jetpack' ),
							index + 1
						) }
						key={ `jetpack-donations-amount-${ index }` }
						onChange={ newAmount => setAmount( newAmount, index ) }
						value={ amount }
					/>
				) ) }
			</div>
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
				value={ getDonationValue( 'extraText' ) }
				onChange={ value => setDonationValue( 'extraText', value ) }
			/>
			<div className="wp-block-button donations__donate-button">
				<RichText
					className="wp-block-button__link"
					placeholder={ __( 'Write a message…', 'jetpack' ) }
					value={ getDonationValue( 'buttonText' ) }
					onChange={ value => setDonationValue( 'buttonText', value ) }
				/>
			</div>
		</div>
	);
};

export default Tab;
