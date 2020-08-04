/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Amount from './amount';
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';

const Amounts = ( { amounts, currency, onChange } ) => {
	const [ previousCurrency, setPreviousCurrency ] = useState( currency );
	const minAmount = minimumTransactionAmountForCurrency( currency );
	const [ defaultAmounts, setDefaultAmounts ] = useState( [
		minAmount * 10, // 1st tier (USD 5)
		minAmount * 30, // 2nd tier (USD 15)
		minAmount * 200, // 3rd tier (USD 100)
	] );

	// Updates the amounts whenever there are new defaults due to a currency change.
	useEffect( () => {
		if ( previousCurrency === currency ) {
			return;
		}
		setPreviousCurrency( { currency: currency } );

		const newDefaultAmounts = [
			minAmount * 10, // 1st tier (USD 5)
			minAmount * 30, // 2nd tier (USD 15)
			minAmount * 200, // 3rd tier (USD 100)
		];
		setDefaultAmounts( newDefaultAmounts );
		onChange( newDefaultAmounts );
	}, [ currency, minAmount, onChange, previousCurrency ] );

	const setAmount = ( amount, tier ) => {
		const newAmounts = [ ...amounts ];
		newAmounts[ tier ] = amount;
		onChange( newAmounts );
	};

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

export default Amounts;
