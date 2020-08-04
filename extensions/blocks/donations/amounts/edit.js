/**
 * External dependencies
 */
import classnames from 'classnames';

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

const Edit = ( { attributes, className, setAttributes } ) => {
	const { amounts, currency, defaultCustomAmount, interval } = attributes;
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
		setAttributes( { currency: currencyFromContext } );

		if ( interval ) {
			const newDefaultAmounts = [
				minAmount * 10, // 1st tier (USD 5)
				minAmount * 30, // 2nd tier (USD 15)
				minAmount * 200, // 3rd tier (USD 100)
			];
			setDefaultAmounts( newDefaultAmounts );
			setAttributes( { amounts: newDefaultAmounts } );
		} else if ( showCustomAmount ) {
			setAttributes( { defaultCustomAmount: minAmount * 100 } );
		}
	}, [ currency, currencyFromContext, interval, minAmount, setAttributes, showCustomAmount ] );

	// Cleans up the attributes.
	useEffect( () => {
		if ( interval ) {
			setAttributes( { defaultCustomAmount: null } );
		} else {
			setAttributes( {
				amounts: null,
				defaultCustomAmount: showCustomAmount ? minAmount * 100 : null,
			} );
		}
	}, [ interval, minAmount, setAttributes, showCustomAmount ] );

	const setAmount = ( amount, tier ) => {
		const newAmounts = [ ...amounts ];
		newAmounts[ tier ] = amount;
		setAttributes( { amounts: newAmounts } );
	};

	if ( ! interval ) {
		if ( ! showCustomAmount ) {
			return null;
		}

		return (
			<Amount
				currency={ currency }
				label={ __( 'Custom amount', 'jetpack' ) }
				defaultValue={ defaultCustomAmount }
				className={ classnames( 'donations__custom-amount', className ) }
				disabled={ true }
			/>
		);
	}

	return (
		<div className={ classnames( 'wp-block-buttons', 'donations__amounts', className ) }>
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
