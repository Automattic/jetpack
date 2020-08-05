/**
 * External dependencies
 */
import formatCurrency from '@automattic/format-currency';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { useContext, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Context from './context';
import Amount from './amount';
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';

const attributesPerInterval = {
	heading: {
		'one-time': 'oneTimeHeading',
		'1 month': 'monthlyHeading',
		'1 year': 'annualHeading',
	},
	buttonText: {
		'one-time': 'oneTimeButtonText',
		'1 month': 'monthlyButtonText',
		'1 year': 'annualButtonText',
	},
};

const Tab = props => {
	const { attributes, setAttributes } = props;
	const { activeTab } = useContext( Context );

	const getAttribute = attributeName => {
		if ( attributeName in attributesPerInterval ) {
			return attributes[ attributesPerInterval[ attributeName ][ activeTab ] ];
		}
		return attributes[ attributeName ];
	};

	const setAttribute = ( attributeName, value ) => {
		if ( attributeName in attributesPerInterval ) {
			return setAttributes( {
				[ attributesPerInterval[ attributeName ][ activeTab ] ]: value,
			} );
		}
		return setAttributes( { [ attributeName ]: value } );
	};

	const amounts = getAttribute( 'amounts' );
	const currency = getAttribute( 'currency' );
	const showCustomAmount = getAttribute( 'showCustomAmount' );
	const minAmount = minimumTransactionAmountForCurrency( currency );

	const [ defaultAmounts, setDefaultAmounts ] = useState( [
		minAmount * 10, // 1st tier (USD 5)
		minAmount * 30, // 2nd tier (USD 15)
		minAmount * 200, // 3rd tier (USD 100)
	] );
	const [ defaultCustomAmount, setDefaultCustomAmount ] = useState( minAmount * 100 );
	const [ previousCurrency, setPreviousCurrency ] = useState( currency );

	// Updates the amounts whenever the currency changes.
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
		setAttributes( { amounts: newDefaultAmounts } );
		setDefaultCustomAmount( minAmount * 100 ); // USD 50
	}, [ currency, minAmount, previousCurrency, setAttributes ] );

	const setAmount = ( amount, tier ) => {
		const newAmounts = [ ...amounts ];
		newAmounts[ tier ] = amount;
		setAttributes( { amounts: newAmounts } );
	};

	if ( ! amounts ) {
		return null;
	}

	return (
		<>
			<RichText
				tagName="h4"
				placeholder={ __( 'Write a message…', 'jetpack' ) }
				value={ getAttribute( 'heading' ) }
				onChange={ value => setAttribute( 'heading', value ) }
			/>
			<RichText
				tagName="p"
				placeholder={ __( 'Write a message…', 'jetpack' ) }
				value={ getAttribute( 'chooseAmountText' ) }
				onChange={ value => setAttribute( 'chooseAmountText', value ) }
			/>
			<div className="wp-block-buttons donations__amounts">
				{ amounts.map( ( amount, index ) => (
					<Amount
						currency={ currency }
						defaultValue={ defaultAmounts[ index ] }
						editable={ true }
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
						value={ getAttribute( 'customAmountText' ) }
						onChange={ value => setAttribute( 'customAmountText', value ) }
					/>
					<Amount
						currency={ currency }
						label={ __( 'Custom amount', 'jetpack' ) }
						defaultValue={ defaultCustomAmount }
						className="donations__custom-amount"
					/>
				</>
			) }
			<div className="donations__separator">——</div>
			<RichText
				tagName="p"
				placeholder={ __( 'Write a message…', 'jetpack' ) }
				value={ getAttribute( 'extraText' ) }
				onChange={ value => setAttribute( 'extraText', value ) }
			/>
			<div className="wp-block-button donations__donate-button">
				<RichText
					className="wp-block-button__link"
					placeholder={ __( 'Write a message…', 'jetpack' ) }
					value={ getAttribute( 'buttonText' ) }
					onChange={ value => setAttribute( 'buttonText', value ) }
				/>
			</div>
		</>
	);
};

export default Tab;
