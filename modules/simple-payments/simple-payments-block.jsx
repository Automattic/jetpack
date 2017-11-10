/** @format */

/**
 * WordPress dependencies
 */
const { PanelBody } = wp.components;
const { __ } = wp.i18n;
const { createClass } = wp.element;

/**
 * Internal dependencies
 */
const { registerBlockType, InspectorControls, BlockDescription } = wp.blocks;
const { ToggleControl, SelectControl, TextControl } = InspectorControls;

// https://github.com/Automattic/gridicons/blob/master/sources/svg/gridicons-money.svg
const moneyGridicon = (
	<svg viewBox="0 0 24 24" width="20" height="20">
		<g id="money">
			<path d="M2,5v14h20V5H2z M7,17c0-1.657-1.343-3-3-3v-4c1.657,0,3-1.343,3-3h10c0,1.657,1.343,3,3,3v4c-1.657,0-3,1.343-3,3H7z M12,9c1.1,0,2,1.3,2,3s-0.9,3-2,3s-2-1.3-2-3S10.9,9,12,9z" />
		</g>
	</svg>
);

const availableCurrencies = [
	{ value: 'US', label: 'USD', symbol: '$' },
	{ value: 'CA', label: 'CAD', symbol: '$' },
	{ value: 'EU', label: 'EUR', symbol: '€' },
];

const getCurrencySymbol = value => availableCurrencies.find( item => item.value === value ).symbol;

const createNewProductCPT = ( { price, currency, multiple, email } ) => {
	return new wp.api.models.Jp_pay_product( {
		title: 'Untitled payment product',
		meta: {
			spay_price: price,
			spay_currency: currency,
			spay_multiple: multiple,
			spay_email: email,
		},
		status: 'publish',
	} );
};

// Global variable from wp_localize_script.
const userEmail = simplePaymentsBlockGlobals.email;

registerBlockType( 'jetpack/simple-payments-button', {
	title: 'Payment Button',

	icon: moneyGridicon,

	category: 'widgets',

	attributes: {
		id: {
			type: 'number',
		},
		price: {
			type: 'number',
			default: 1,
		},
		currency: {
			type: 'string',
			default: 'US',
		},
		showIcons: {
			type: 'boolean',
			default: true,
		},
		multiple: {
			type: 'boolean',
			default: false,
		},
		email: {
			type: 'string',
			default: userEmail,
		},
	},

	edit: createClass( {
		getInitialState() {
			return {
				productModel: null,
			};
		},
		componentDidMount() {
			const { attributes, setAttributes } = this.props;
			const { price, currency, multiple, id, email } = attributes;

			if ( id ) {
				let model = new wp.api.models.Jp_pay_product( { id } );

				model.fetch().then( _ => this.setState( { productModel: model } ) );
			} else {
				let model = createNewProductCPT( { price, currency, multiple, email } );

				this.setState( { productModel: model } );

				model.save().then( productCPT => {
					if ( productCPT && productCPT.id ) {
						setAttributes( { id: productCPT.id } );
					}
				} );
			}
		},
		componentWillReceiveProps( nextProps ) {
			const { price, currency, multiple, email } = this.props.attributes;
			const {
				price: newPrice,
				currency: newCurrency,
				multiple: newMultiple,
				email: newEmail,
			} = nextProps.attributes;

			const { productModel } = this.state;

			if (
				newPrice !== price ||
				newCurrency !== currency ||
				newMultiple !== multiple ||
				newEmail !== email
			) {
				productModel.set( {
					meta: {
						spay_price: newPrice,
						spay_currency: newCurrency,
						spay_multiple: newMultiple,
						spay_email: newEmail,
					},
				} );

				productModel.save();
			}
		},
		render() {
			const { className, attributes, setAttributes, focus } = this.props;
			const { price, currency, showIcons, multiple, email } = attributes;

			const updatePrice = ( { target: { value } } ) => setAttributes( { price: value } );

			const updateCurrency = value => setAttributes( { currency: value } );

			const toggleShowIcons = () => setAttributes( { showIcons: ! showIcons } );

			const toggleMultiple = () => setAttributes( { multiple: ! multiple } );

			const updateEmail = value => setAttributes( { email: value } );

			return [
				focus &&
					<InspectorControls key="inspector">
						<BlockDescription>
							<p>
								{ __(
									'A payment button. Sell tickets, collect donations, accept tips, and more.'
								) }
							</p>
						</BlockDescription>
						<PanelBody title={ __( 'Payment button settings' ) }>
							<SelectControl
								label={ __( 'Currency' ) }
								options={ availableCurrencies }
								onChange={ updateCurrency }
							/>
							<ToggleControl
								label={ __( 'Show credit card icons' ) }
								checked={ showIcons }
								onChange={ toggleShowIcons }
							/>
							<ToggleControl
								label={ __( 'Allow multiple items' ) }
								checked={ multiple }
								onChange={ toggleMultiple }
							/>
							<TextControl
								label={ __( 'Email' ) }
								value={ email }
								onChange={ updateEmail }
								help={ __(
									"This is where PayPal will send your money. To claim a payment, you'll need " +
										'a PayPal account connected to a bank account.'
								) }
							/>
						</PanelBody>
					</InspectorControls>,
				<div className={ className }>
					<div className="jetpack-simple-payments jetpack-simple-payments-wrapper">
						<div className="jetpack-simple-payments-product">
							<div className="jetpack-simple-payments-details">
								<div className="jetpack-simple-payments-price">
									<p>
										{ getCurrencySymbol( currency ) }
										<input type="number" onChange={ updatePrice } value={ price } />
									</p>
								</div>
								<div className="jetpack-simple-payments-purchase-box">
									{ multiple &&
										<div className="jetpack-simple-payments-items">
											<input
												className="jetpack-simple-payments-items-number"
												type="number"
												placeholder="1"
												disabled={ true }
											/>
										</div> }
									<div className="jetpack-simple-payments-button">
										<div className="paypal-button">Pay with</div>

										{ showIcons &&
											<div className="payment-options">
												<div className="visa" />
												<div className="mastercard" />
												<div className="amex" />
												<div className="discover" />
											</div> }
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>,
			];
		},

		componentWillUnmount() {
			const { productModel } = this.state;

			if ( productModel.state && productModel.state() === 'pending' ) {
				productModel.abort();
			}
		},
	} ),

	save() {
		return null;
	},
} );
