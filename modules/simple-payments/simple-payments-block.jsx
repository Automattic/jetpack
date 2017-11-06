const { registerBlockType } = wp.blocks;

registerBlockType( 'jetpack/simple-payments-button', {
	title: 'Payment Button',

	icon: 'cart',

	category: 'layout',

	edit() {
		return (
			<div className="jetpack-payments-button__container">
				<div>
					USD $ <input type="text" placeholder="0.00" />
				</div>

				<div className="jetpack-payments-button__paypal-button">
					Pay with
				</div>
				<div className="jetpack-payments-button__payment-options">
					<div className="jetpack-payments-button__card-image jetpack-payments-button__visa"></div>
					<div className="jetpack-payments-button__card-image jetpack-payments-button__mastercard"></div>
					<div className="jetpack-payments-button__card-image jetpack-payments-button__amex"></div>
					<div className="jetpack-payments-button__card-image jetpack-payments-button__discover"></div>
				</div>
			</div>
		);
	},

	save() {
		return <p className="jetpack-payments-button__container">Simple payment button saved content.</p>;
	},
} );
