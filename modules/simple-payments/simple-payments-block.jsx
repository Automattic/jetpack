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
const { registerBlockType, source, InspectorControls, BlockDescription } = wp.blocks;
const { ToggleControl, SelectControl } = InspectorControls;
const { text } = source;

const availableCurrencies = [
	{ value: 'US', label: 'USD', symbol: '$' },
	{ value: 'CA', label: 'CAD', symbol: '$' },
	{ value: 'EU', label: 'EUR', symbol: '€' },
];

const getCurrencySymbol = value => availableCurrencies.find( item => item.value === value ).symbol;

const createNewProductCPT = ( { price, currency, multiple } ) => {
	return new wp.api.models.Jp_pay_product( {
		title: 'Untitled payment product',
		meta: {
			spay_price: price,
			spay_currency: currency,
			spay_multiple: multiple,
		},
		status: 'publish',
	} );
};

registerBlockType( 'jetpack/simple-payments-button', {
	title: 'Payment Button',

	icon: 'cart',

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
	},

	edit: createClass( {
		getInitialState() {
			return {
				productModel: null,
			};
		},
		componentDidMount() {
			const { attributes, setAttributes } = this.props;
			const { price, currency, multiple, id } = attributes;

			if ( id ) {
				let model = new wp.api.models.Jp_pay_product( { id } );

				model.fetch().then( _ => this.setState( { productModel: model } ) );
			} else {
				let model = createNewProductCPT( { price, currency, multiple } );

				this.setState( { productModel: model } );

				model.save().then( productCPT => {
					if ( productCPT && productCPT.id ) {
						setAttributes( { id: productCPT.id } );
					}
				} );
			}
		},
		componentWillReceiveProps( nextProps ) {
			const { price, currency, multiple } = this.props.attributes;
			const {
				price: newPrice,
				currency: newCurrency,
				multiple: newMultiple,
			} = nextProps.attributes;

			const { productModel } = this.state;

			if ( newPrice !== price || newCurrency !== currency || newMultiple !== multiple ) {
				productModel.set( {
					meta: { spay_price: newPrice, spay_currency: newCurrency, spay_multiple: newMultiple },
				} );

				productModel.save();
			}
		},
		render() {
			const { className, attributes, setAttributes, focus } = this.props;
			const { price, currency, showIcons, multiple } = attributes;

			const updatePrice = ( { target: { value } } ) => setAttributes( { price: value } );

			const updateCurrency = value => setAttributes( { currency: value } );

			const toggleShowIcons = () => setAttributes( { showIcons: ! showIcons } );

			const toggleMultiple = () => setAttributes( { multiple: ! multiple } );

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
						</PanelBody>
					</InspectorControls>,
				<div className={ className }>
					<div class="jetpack-simple-payments jetpack-simple-payments-wrapper">
						<div class="jetpack-simple-payments-product">
							<div class="jetpack-simple-payments-details">
								<div class="jetpack-simple-payments-price">
									<p>
										{ getCurrencySymbol( currency ) }
										<input type="number" onChange={ updatePrice } value={ price } />
									</p>
								</div>
								<div class="jetpack-simple-payments-purchase-box">
									{ multiple &&
										<div class="jetpack-simple-payments-items">
											<input
												class="jetpack-simple-payments-items-number"
												type="number"
												placeholder="1"
												disabled={ true }
											/>
										</div> }
									<div class="jetpack-simple-payments-button">
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
