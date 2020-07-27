/**
 * External dependencies
 */
import formatCurrency, { CURRENCIES } from '@automattic/format-currency';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Context from './context';
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
	const { attributes, interval, setAttributes } = props;
	const [ customAmountPlaceholder, setCustomAmountPlaceholder ] = useState( null );

	const getAttribute = attributeName => {
		if ( attributeName in attributesPerInterval ) {
			return attributes[ attributesPerInterval[ attributeName ][ interval ] ];
		}
		return attributes[ attributeName ];
	};

	const setAttribute = ( attributeName, value ) => {
		if ( attributeName in attributesPerInterval ) {
			return setAttributes( {
				[ attributesPerInterval[ attributeName ][ interval ] ]: value,
			} );
		}
		return setAttributes( { [ attributeName ]: value } );
	};
	const currency = getAttribute( 'currency' );
	const amounts = getAttribute( 'amounts' );
	const showCustomAmount = getAttribute( 'showCustomAmount' );

	// Updates the custom amount placeholder whenever the currency changes.
	useEffect( () => {
		if ( ! showCustomAmount ) {
			setCustomAmountPlaceholder( null );
			return;
		}

		const minAmount = minimumTransactionAmountForCurrency( currency );
		setCustomAmountPlaceholder( minAmount * 100 ); // USD 50
	}, [ currency, showCustomAmount ] );

	if ( ! amounts ) {
		return null;
	}

	return (
		<Context.Consumer>
			{ ( { activeTab } ) => (
				<div hidden={ activeTab !== interval }>
					<RichText
						tagName="h4"
						placeholder={ __( 'Write a message…', 'jetpack' ) }
						value={ getAttribute( 'heading' ) }
						onChange={ value => setAttribute( 'heading', value ) }
						inlineToolbar
					/>
					<RichText
						tagName="p"
						placeholder={ __( 'Write a message…', 'jetpack' ) }
						value={ getAttribute( 'chooseAmountText' ) }
						onChange={ value => setAttribute( 'chooseAmountText', value ) }
						inlineToolbar
					/>
					<div className="wp-block-buttons donations__amounts">
						{ amounts.map( amount => (
							<div className="wp-block-button donations__amount">
								<div className="wp-block-button__link">{ formatCurrency( amount, currency ) }</div>
							</div>
						) ) }
					</div>
					{ customAmountPlaceholder && (
						<>
							<RichText
								tagName="p"
								placeholder={ __( 'Write a message…', 'jetpack' ) }
								value={ getAttribute( 'customAmountText' ) }
								onChange={ value => setAttribute( 'customAmountText', value ) }
								inlineToolbar
							/>
							<div className="wp-block-button donations__amount donations__custom-amount">
								<div className="wp-block-button__link">
									{ CURRENCIES[ currency ].symbol }
									<span className="donations__custom-amount-placeholder">
										{ formatCurrency( customAmountPlaceholder, currency, { symbol: '' } ) }
									</span>
								</div>
							</div>
						</>
					) }
					<div className="donations__separator">——</div>
					<RichText
						tagName="p"
						placeholder={ __( 'Write a message…', 'jetpack' ) }
						value={ getAttribute( 'extraText' ) }
						onChange={ value => setAttribute( 'extraText', value ) }
						inlineToolbar
					/>
					<RichText
						wrapperClassName="wp-block-button donations__donate-button"
						className="wp-block-button__link"
						placeholder={ __( 'Write a message…', 'jetpack' ) }
						value={ getAttribute( 'buttonText' ) }
						onChange={ value => setAttribute( 'buttonText', value ) }
						inlineToolbar
					/>
				</div>
			) }
		</Context.Consumer>
	);
};

export default Tab;
