const {
	registerBlockType,
	source,
	InspectorControls,
	BlockDescription
} = wp.blocks;

const { PanelBody } = wp.components;
const { __ } = wp.i18n;

const { ToggleControl } = InspectorControls;
const { text } = source;

registerBlockType( 'jetpack/simple-payments-button', {
	title: 'Payment Button',

	icon: 'cart',

	category: 'widgets',

	attributes: {
		price: {
			type: 'number',
			source: text( 'span' ),
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
			showIcons,
			multipleItems
		} = attributes;

		const onChangePrice = ( { target: { value } } ) => setAttributes( { price: value } );

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
					USD $
					<input
						type="number"
						onChange={ onChangePrice }
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

	save( { attributes, className } ) {
		const {
			price,
			showIcons,
			multipleItems
		} = attributes;

		return (
			<div className={ className }>
				<div className="price-box">
					USD $ <span>{ price }</span>
				</div>

				{ multipleItems &&
					<div>
						<label> { __( 'Quantity' ) } </label>
						<input
							type="number"
							placeholder="1"
							className="quantity"
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
		);
	},
} );
