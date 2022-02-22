/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * External dependencies
 */
import classnames from 'classnames';
import formatCurrency, { CURRENCIES } from '@automattic/format-currency';

/**
 * Internal dependencies
 */
import { minimumTransactionAmountForCurrency } from '../../../shared/currencies';

const Save = ( { attributes } ) => {
	const { disabled, currency, amount } = attributes;

	const className = classnames( 'donations__amount wp-block-button wp-block-button__link', {
		'donations__custom-amount': disabled,
	} );
	const blockProps = useBlockProps.save( { className } );

	if ( disabled ) {
		const defaultAmount = minimumTransactionAmountForCurrency( currency ) * 100;

		return (
			<div { ...blockProps }>
				{ CURRENCIES[ currency ].symbol }
				<div
					className="donations__amount-value"
					data-currency={ currency }
					data-empty-text={ formatCurrency( defaultAmount, currency, { symbol: '' } ) }
				></div>
			</div>
		);
	}

	return (
		<div { ...blockProps } data-amount={ amount }>
			{ CURRENCIES[ currency ].symbol }
			{ formatCurrency( amount, currency, { symbol: '' } ) }
		</div>
	);
};

export default Save;
