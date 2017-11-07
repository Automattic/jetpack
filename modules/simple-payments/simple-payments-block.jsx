const { registerBlockType, source, InspectorControls, BlockDescription } = wp.blocks;
const { text } = source;

const i18n = jpPaymentButtonI18n;

registerBlockType( 'jetpack/simple-payments-button', {
	title: 'Payment Button',

	icon: 'cart',

	category: 'widgets',

	attributes: {
		price: {
			type: 'number',
			source: text( 'span' )
		},
	},

	edit( { attributes, className, setAttributes, focus, setFocus } ) {
		const { price } = attributes;

		function onChangePrice( { target: { value } } ) {
			setAttributes( { price: value } );
		}

		return [
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ i18n[ 'Description' ] }</p>
					</BlockDescription>
				</InspectorControls>
			),
			<div className={ className }>
				<div>
					USD $
					<input
						type="number"
						onChange={ onChangePrice }
						value={ price }
					/>
				</div>

				<div className="paypal-button">
					Pay with
				</div>
				<div className="payment-options">
					<div className="visa"></div>
					<div className="mastercard"></div>
					<div className="amex"></div>
					<div className="discover"></div>
				</div>
			</div>
		];
	},

	save( { attributes, className } ) {
		const { price } = attributes;

		return (
			<div className={ className }>
				<div>
					USD $ <span>{ price }</span>
				</div>

				<div className="paypal-button">
					Pay with
				</div>
				<div className="payment-options">
					<div className="visa"></div>
					<div className="mastercard"></div>
					<div className="amex"></div>
					<div className="discover"></div>
				</div>
			</div>
		);
	},
} );
