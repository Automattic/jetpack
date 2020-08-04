/**
 * External dependencies
 */
import formatCurrency, { CURRENCIES } from '@automattic/format-currency';

const Save = ( { attributes } ) => {
	const { amounts, currency, interval, defaultCustomAmount } = attributes;

	if ( ! interval ) {
		if ( ! defaultCustomAmount ) {
			return null;
		}
		return (
			<div className="wp-block-button donations__amount donations__custom-amount">
				<div className="wp-block-button__link">
					{ CURRENCIES[ currency ].symbol }
					<span className="donations__amount-value">
						{ formatCurrency( defaultCustomAmount, currency, { symbol: '' } ) }
					</span>
				</div>
			</div>
		);
	}

	if ( ! amounts ) {
		return null;
	}

	return (
		<div className="wp-block-buttons donations__amounts">
			{ amounts.map( amount => (
				<div
					className="wp-block-button donations__amount"
					data-interval={ interval }
					data-amount={ amount }
				>
					<div className="wp-block-button__link">
						{ CURRENCIES[ currency ].symbol }
						<span className="donations__amount-value">
							{ formatCurrency( amount, currency, { symbol: '' } ) }
						</span>
					</div>
				</div>
			) ) }
		</div>
	);
};

export default Save;
