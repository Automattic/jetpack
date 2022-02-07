/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import formatCurrency, { CURRENCIES } from '@automattic/format-currency';

/**
 * External dependencies
 */
import { minimumTransactionAmountForCurrency } from '../../../shared/currencies';
import classnames from 'classnames';

const Save = ( { attributes } ) => {
	const { disabled, currency, amount } = attributes;

	if ( disabled ) {
		const className = classnames( 'donations__amount wp-block-button wp-block-button__link', {
			'donations__custom-amount': disabled,
		} );
		const blockProps = useBlockProps.save( { className } );

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

	const className = 'donations__amount wp-block-button wp-block-button__link';
	const blockProps = useBlockProps.save( { className } );

	return (
		<div { ...blockProps } data-amount={ amount }>
			{ CURRENCIES[ currency ].symbol }
			{ formatCurrency( amount, currency, { symbol: '' } ) }
		</div>
	);
};

export default Save;
