/**
 * External dependencies
 */
import formatCurrency, { CURRENCIES } from '@automattic/format-currency';

/**
 * WordPress dependencies
 */
import { PlainText, RichText } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Context from './context';
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';
import AmountInput from './amount-input';

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
	const [ editedAmounts, setEditedAmounts ] = useState( null );

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

	// Whenever the currency changes...
	useEffect( () => {
		// Updates the custom amount placeholder.
		const minAmount = minimumTransactionAmountForCurrency( currency );
		setCustomAmountPlaceholder( minAmount * 100 ); // USD 50

		// Resets the state used by the inputs handling the amounts.
		setEditedAmounts( null );
	}, [ currency ] );

	// Initializes the state used by the inputs handling the amounts.
	useEffect( () => {
		if ( editedAmounts || ! amounts ) {
			return;
		}
		setEditedAmounts( amounts.map( amount => formatCurrency( amount, currency, { symbol: '' } ) ) );
	}, [ amounts, editedAmounts, currency ] );

	if ( ! editedAmounts ) {
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
					/>
					<RichText
						tagName="p"
						placeholder={ __( 'Write a message…', 'jetpack' ) }
						value={ getAttribute( 'chooseAmountText' ) }
						onChange={ value => setAttribute( 'chooseAmountText', value ) }
					/>
					<div className="wp-block-buttons donations__amounts">
						{ editedAmounts.map( ( amount, index ) => (
							<AmountInput
								amount={ amount }
								amounts={ amounts }
								currency={ currency }
								editedAmounts={ editedAmounts }
								label={ sprintf(
									// translators: %d: Tier level e.g: "1", "2", "3"
									__( 'Tier %d', 'jetpack' ),
									index + 1
								) }
								placeholder={ sprintf(
									// translators: %d: Tier level e.g: "1", "2", "3"
									__( 'Tier %d', 'jetpack' ),
									index + 1
								) }
								key={ `jetpack-donations-amount-input-${ index }` }
								setAttributes={ setAttributes }
								setEditedAmounts={ setEditedAmounts }
								tier={ index }
							/>
						) ) }
					</div>
					{ showCustomAmount && (
						<>
							<RichText
								tagName="p"
								placeholder={ __( 'Write a message…', 'jetpack' ) }
								value={ getAttribute( 'customAmountText' ) }
								onChange={ value => setAttribute( 'customAmountText', value ) }
							/>
							<AmountInput
								currency={ currency }
								label={ __( 'Custom amount', 'jetpack' ) }
								placeholder={ formatCurrency( customAmountPlaceholder, currency, { symbol: '' } ) }
								className="donations__custom-amount"
							/>
						</>
					) }
					<div className="donations__separator">——</div>
					<RichText
						tagName="p"
						placeholder={ __( 'Write a message…', 'jetpack' ) }
						value={ getAttribute( 'extraText' ) }
						onChange={ value => setAttribute( 'extraText', value ) }
					/>
					<div className="wp-block-button donations__donate-button">
						<RichText
							className="wp-block-button__link"
							placeholder={ __( 'Write a message…', 'jetpack' ) }
							value={ getAttribute( 'buttonText' ) }
							onChange={ value => setAttribute( 'buttonText', value ) }
						/>
					</div>
				</div>
			) }
		</Context.Consumer>
	);
};

export default Tab;
