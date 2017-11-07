const { registerBlockType } = wp.blocks;

registerBlockType( 'jetpack/simple-payments-button', {
	title: 'Payment Button',

	icon: 'cart',

	category: 'widgets',

	edit( { className } ) {
		return (
			<div className={ className }>
				<div>
					USD $ <input type="text" placeholder="0.00" />
				</div>

				<div className={ `${ className }__paypal-button` }>
					Pay with
				</div>
				<div className={ `${ className }__payment-options` }>
					<div className={ `${ className }__visa` }></div>
					<div className={ `${ className }__mastercard` }></div>
					<div className={ `${ className }__amex` }></div>
					<div className={ `${ className }__discover` }></div>
				</div>
			</div>
		);
	},

	save( { className } ) {
		return <div className={ className }>Simple payment button saved content.</div>;
	},
} );
