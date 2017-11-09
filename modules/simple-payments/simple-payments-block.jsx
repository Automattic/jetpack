/**
 * WordPress dependencies
 */
const { PanelBody } = wp.components;
const { __ } = wp.i18n;

/**
 * Internal dependencies
 */
const {
	registerBlockType,
	source,
	InspectorControls,
	BlockDescription
} = wp.blocks;
const { ToggleControl, SelectControl } = InspectorControls;
const { text } = source;

const availableCurrencies = [
	{ value: 'US', label: 'USD', symbol: '$' },
	{ value: 'CA', label: 'CAD', symbol: '$' },
	{ value: 'EU', label: 'EUR', symbol: '€' },
];

const getCurrencySymbol = ( value ) =>
	availableCurrencies.find( item => item.value === value ).symbol;

registerBlockType( 'jetpack/simple-payments-button', {
	title: 'Payment Button',

	icon: 'cart',

	category: 'widgets',

	attributes: {
		price: {
			type: 'number',
			source: text( 'span' ),
		},
		currency: {
			type: 'string',
			default: 'US',
		},
		showIcons: {
			type: 'boolean',
			default: true,
		},
		multipleItems: {
			type: 'boolean',
			default: false,
		}
	},

	edit( { attributes, className, setAttributes, focus } ) {
		const {
			price,
			currency,
			showIcons,
			multipleItems
		} = attributes;

		const updatePrice = ( { target: { value } } ) => setAttributes( { price: value } );

		const updateCurrency = ( value ) => setAttributes( { currency: value } );

		const toggleShowIcons = () => setAttributes( { showIcons: ! showIcons } );

		const toggleMultipleItems = () => setAttributes( { multipleItems: ! multipleItems } );

		return [
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>
							{ __( 'A payment button. Sell tickets, collect donations, accept tips, and more.' ) }
						</p>
					</BlockDescription>
					<PanelBody title={ __( 'Payment button settings' ) }>
						<SelectControl
							label={ __( 'Currency' ) }
							options={ availableCurrencies }
							onChange={ updateCurrency }
						/>
						<ToggleControl
							label={ __( 'Show credit card icons' )  }
							checked={ showIcons }
							onChange={ toggleShowIcons }
						/>
						<ToggleControl
							label={ __( 'Allow multiple items' )  }
							checked={ multipleItems }
							onChange={ toggleMultipleItems }
						/>
					</PanelBody>
				</InspectorControls>
			),
			<div className={ className }>
				<div className="price-box">
					{ getCurrencySymbol( currency ) }
					<input
						type="number"
						onChange={ updatePrice }
						value={ price }
					/>
				</div>

				{ multipleItems &&
					<div>
						<label> { __( 'Quantity' ) } </label>
						<input
							type="number"
							placeholder="1"
							className="quantity"
							disabled={ true }
						/>
					</div>
				}

				<div className="paypal-button">
					Pay with
				</div>

				{ showIcons &&
					<div className="payment-options">
						<div className="visa"></div>
						<div className="mastercard"></div>
						<div className="amex"></div>
						<div className="discover"></div>
					</div>
				}
			</div>
		];
	},

	save( { attributes } ) {
		const {
			price,
			currency,
			multipleItems
		} = attributes;

		// PayPal button will be rendered on the server with
		// paypal-express-checkout inline script
		return (
			<div className="jetpack-simple-payments-wrapper">
				<div className="jetpack-simple-payments-product">
					<div className="jetpack-simple-payments-details">
						<div className="jetpack-simple-payments-price">
							<p>
								{ getCurrencySymbol( currency ) + price }
							</p>
						</div>

						<div className="jetpack-simple-payments-purchase-box">
							{ multipleItems &&
								<div class="jetpack-simple-payments-items">
									<label> { __( 'Quantity' ) } </label>
									<input
										type="number"
										placeholder="1"
										min="1"
										className="jetpack-simple-payments-items-number"
									/>
								</div>
							}

							<div
								id="paypal-express-checkout_button"
								className="jetpack-simple-payments-button"
							></div>
						</div>
					</div>
				</div>
			</div>
		);
	},
} );
