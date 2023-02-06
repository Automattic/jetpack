import { RichText } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';
import Amount from './amount';

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

	// Updates the amounts whenever there are new defaults due to a currency change.
	const [ previousCurrency, setPreviousCurrency ] = useState( currency );
	const minAmount = minimumTransactionAmountForCurrency( currency );
	const defaultAmounts = useMemo(
		() => [
			minAmount * 10, // 1st tier (USD 5)
			minAmount * 30, // 2nd tier (USD 15)
			minAmount * 200, // 3rd tier (USD 100)
		],
		[ minAmount ]
	);
	useEffect( () => {
		if ( previousCurrency === currency ) {
			return;
		}
		setPreviousCurrency( currency );

		setAttributes( {
			oneTimeDonation: { ...oneTimeDonation, amounts: defaultAmounts },
			monthlyDonation: { ...monthlyDonation, amounts: defaultAmounts },
			annualDonation: { ...annualDonation, amounts: defaultAmounts },
		} );
	}, [
		currency,
		previousCurrency,
		defaultAmounts,
		oneTimeDonation,
		monthlyDonation,
		annualDonation,
		setAttributes,
	] );

	const amounts = getDonationValue( 'amounts' );

	const setAmount = ( amount, tier ) => {
		const newAmounts = [ ...amounts ];
		newAmounts[ tier ] = amount;
		setDonationValue( 'amounts', newAmounts );
	};

	// Keeps in sync the donate buttons labels across all intervals once the default value is overridden in one of them.
	const setButtonText = buttonText => {
		setAttributes( {
			oneTimeDonation: { ...oneTimeDonation, buttonText: buttonText },
			monthlyDonation: { ...monthlyDonation, buttonText: buttonText },
			annualDonation: { ...annualDonation, buttonText: buttonText },
		} );
	};

	const formatTypes = useSelect( select => select( 'core/rich-text' ).getFormatTypes(), [] );
	const allowedFormatsForButton = formatTypes
		.map( format => format.name )
		.filter( format => format !== 'core/link' );

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
			<div className="donations__amounts">
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
			<hr className="donations__separator" />
			<RichText
				tagName="p"
				placeholder={ __( 'Write a message…', 'jetpack' ) }
				value={ getDonationValue( 'extraText' ) }
				onChange={ value => setDonationValue( 'extraText', value ) }
			/>
			<div className="wp-block-button donations__donate-button-wrapper">
				<RichText
					className="wp-block-button__link donations__donate-button"
					placeholder={ __( 'Write a message…', 'jetpack' ) }
					value={ getDonationValue( 'buttonText' ) }
					onChange={ value => setButtonText( value ) }
					allowedFormats={ allowedFormatsForButton }
				/>
			</div>
		</div>
	);
};

export default Tab;
