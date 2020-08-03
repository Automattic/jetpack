/**
 * WordPress dependencies
 */
import { useContext, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Amount from './amount';
import Context from '../context';
import { minimumTransactionAmountForCurrency } from '../../../shared/currencies';

const Edit = ( { attributes, setAttributes } ) => {
	const { amounts, currency, defaultCustomAmount, isCustom } = attributes;
	const { currency: currencyFromContext, showCustomAmount } = useContext( Context );
	const minAmount = minimumTransactionAmountForCurrency( currencyFromContext );

	const [ defaultAmounts, setDefaultAmounts ] = useState( [
		minAmount * 10, // 1st tier (USD 5)
		minAmount * 30, // 2nd tier (USD 15)
		minAmount * 200, // 3rd tier (USD 100)
	] );

	// Updates the amounts whenever there are new defaults due to a currency change.
	useEffect( () => {
		if ( currencyFromContext === currency ) {
			return;
		}

		const newDefaultAmounts = [
			minAmount * 10, // 1st tier (USD 5)
			minAmount * 30, // 2nd tier (USD 15)
			minAmount * 200, // 3rd tier (USD 100)
		];

		setDefaultAmounts( newDefaultAmounts );
		setAttributes( {
			amounts: newDefaultAmounts,
			currency: currencyFromContext,
			defaultCustomAmount: minAmount * 100, // USD 50
		} );
	}, [ currency, currencyFromContext, minAmount, setAttributes ] );

	// Cleans up the attributes.
	useEffect( () => {
		if ( isCustom ) {
			setAttributes( {
				amounts: null,
				defaultCustomAmount: showCustomAmount ? minAmount * 100 : null,
			} );
		} else {
			setAttributes( { defaultCustomAmount: null } );
		}
	}, [ isCustom, minAmount, showCustomAmount, setAttributes ] );

	const setAmount = ( amount, tier ) => {
		const newAmounts = [ ...amounts ];
		newAmounts[ tier ] = amount;
		setAttributes( { amounts: newAmounts } );
	};

	if ( isCustom ) {
		if ( ! showCustomAmount ) {
			return null;
		}

		return (
			<Amount
				currency={ currency }
				label={ __( 'Custom amount', 'jetpack' ) }
				defaultValue={ defaultCustomAmount }
				className="donations__custom-amount"
				disabled={ true }
			/>
		);
	}

	return (
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
	);
};

export default Edit;
