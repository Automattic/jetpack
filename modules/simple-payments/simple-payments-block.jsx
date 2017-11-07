const {
	registerBlockType,
	source,
	InspectorControls,
	BlockDescription
} = wp.blocks;

const {
	PanelBody
} = wp.components;

const { ToggleControl } = InspectorControls;
const { text } = source;

const i18n = jpPaymentButtonI18n;

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
		}
	},

	edit( { attributes, className, setAttributes, focus, setFocus } ) {
		const { price, showIcons, multipleItems } = attributes;

		const onChangePrice = ( { target: { value } } ) => setAttributes( { price: value } );
		const toggleShowIcons = () => setAttributes( { showIcons: ! showIcons } );
		const toggleMultipleItems = () => setAttributes( { multipleItems: ! multipleItems } );

		return [
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ i18n[ 'description' ] }</p>
					</BlockDescription>
					<PanelBody title={ i18n[ 'settings' ] }>
						<ToggleControl
							label={ i18n[ 'icons toggle' ]  }
							checked={ showIcons }
							onChange={ toggleShowIcons }
						/>
						<ToggleControl
							label={ i18n[ 'allow multiple items' ]  }
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
						<label> { i18n[ 'quantity' ] } </label>
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
		const { price, showIcons, multipleItems } = attributes;

		return (
			<div className={ className }>
				<div className="price-box">
					USD $ <span>{ price }</span>
				</div>

				{ multipleItems &&
					<div>
						<label> { i18n[ 'quantity' ] } </label>
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
