/**
 * External dependencies
 */
import { CURRENCIES } from '@automattic/format-currency';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';

const parseAmount = ( amount, currency ) => {
	if ( ! amount ) {
		return null;
	}

	amount = parseFloat(
		amount
			// Remove any thousand grouping separator.
			.replace( new RegExp( '\\' + CURRENCIES[ currency ].grouping, 'g' ), '' )
			// Replace the localized decimal separator with a dot (the standard decimal separator in float numbers).
			.replace( new RegExp( '\\' + CURRENCIES[ currency ].decimal, 'g' ), '.' )
	);

	if ( isNaN( amount ) ) {
		return null;
	}

	return amount;
};

const setAmount = (
	amount,
	currency,
	tier,
	amounts,
	editedAmounts,
	setAttributes,
	setEditedAmounts
) => {
	const newEditedAmounts = [ ...editedAmounts ];
	newEditedAmounts[ tier ] = amount;
	setEditedAmounts( newEditedAmounts );

	const parsedAmount = parseAmount( amount, currency );
	if ( parsedAmount && parsedAmount >= minimumTransactionAmountForCurrency( currency ) ) {
		const newAmounts = [ ...amounts ];
		newAmounts[ tier ] = parsedAmount;
		setAttributes( { amounts: newAmounts } );
	}
};

const AmountInput = ( {
	amount = '',
	amounts = null,
	className = '',
	currency = null,
	editedAmounts = null,
	label = '',
	placeholder = '',
	setAttributes = null,
	setEditedAmounts = null,
	tier = null,
} ) => (
	<div className={ `wp-block-button donations__amount ${ className }` }>
		<div className="wp-block-button__link">
			{ CURRENCIES[ currency ].symbol }
			<RichText
				value={ amount }
				placeholder={ placeholder }
				aria-label={ label }
				onChange={ value =>
					setAmount(
						value,
						currency,
						tier,
						amounts,
						editedAmounts,
						setAttributes,
						setEditedAmounts
					)
				}
				multiline={ false }
				withoutInteractiveFormatting
				allowedFormats={ [] }
				keepPlaceholderOnFocus={ true }
			/>
		</div>
	</div>
);

export default AmountInput;
