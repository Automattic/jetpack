/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Amount from './amount';

const Save = ( { attributes } ) => {
	const { amounts, currency, isCustom, defaultCustomAmount } = attributes;

	if ( isCustom ) {
		if ( ! defaultCustomAmount ) {
			return null;
		}

		return (
			<Amount
				currency={ currency }
				label={ __( 'Custom amount', 'jetpack' ) }
				defaultValue={ defaultCustomAmount }
				className="donations__custom-amount"
				editable={ true }
			/>
		);
	}

	return (
		<div className="wp-block-buttons donations__amounts">
			{ amounts.map( ( amount, index ) => (
				<Amount
					currency={ currency }
					key={ `jetpack-donations-amount-${ index }` }
					value={ amount }
				/>
			) ) }
		</div>
	);
};

export default Save;
