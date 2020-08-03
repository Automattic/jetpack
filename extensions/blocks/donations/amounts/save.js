/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Amount from './amount';
import classnames from 'classnames';
import formatCurrency, { CURRENCIES } from '@automattic/format-currency';

const Save = ( { attributes } ) => {
	const { amounts, currency, isCustom, defaultCustomAmount } = attributes;

	if ( isCustom ) {
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

	return (
		<div className="wp-block-buttons donations__amounts">
			{ amounts.map( amount => (
				<div className="wp-block-button donations__amount">
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
