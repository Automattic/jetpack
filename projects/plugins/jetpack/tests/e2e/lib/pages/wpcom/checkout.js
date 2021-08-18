/**
 * Internal dependencies
 */
import WpPage from '../wp-page';

export default class CheckoutPage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.checkout__content .wp-checkout__review-order-step' ] } );
	}

	async processPurchase( cardCredentials ) {
		// Enter billing info
		await this.selectOption( `select#country-selector`, cardCredentials.cardCountryCode );
		await this.fill( '#contact-postal-code', cardCredentials.cardPostCode, {
			delay: 10,
		} );
		await this.click( '.checkout-step.is-active .checkout-button' );

		// Pick a payment method
		const isExistingCard = await this.isElementVisible( 'label[for*="existingCard"]', 2000 );

		if ( ! isExistingCard ) {
			await this.click( 'label[for="card"]' );
			await this.enterTestCreditCardDetails( cardCredentials );
		}

		await this.submitPaymentDetails();
		return await this.waitToDisappear();
	}

	async enterTestCreditCardDetails( { cardHolder, cardNumber, cardExpiry, cardCVV } ) {
		await this.fill( '#cardholder-name', cardHolder, { delay: 10 } );

		await this.waitAndTypeInIframe( '.number', "input[name='cardnumber']", cardNumber );
		await this.waitAndTypeInIframe( '.cvv', "input[name='cvc']", cardCVV );
		return await this.waitAndTypeInIframe(
			'.expiration-date',
			"input[name='exp-date']",
			cardExpiry
		);
	}

	async submitPaymentDetails() {
		const paymentButtonSelector = '.checkout-submit-button button';

		await this.click( paymentButtonSelector );
		return await this.waitForPaymentProcessing();
	}

	async waitForPaymentProcessing() {
		const progressBarSelector = '.checkout-submit-button .is-busy';
		await this.waitForElementToBeVisible( progressBarSelector );
		await this.waitForElementToBeHidden( progressBarSelector, 3 * 30000 );
	}

	async waitToDisappear() {
		return await this.waitForElementToBeHidden( this.selectors[ 0 ], 5 * 30000 );
	}

	// Switches to credit-card specific iframe and type the value into relative input
	async waitAndTypeInIframe( iframeSelector, what, value ) {
		const fullSelector = `.credit-card-form-fields ${ iframeSelector } iframe`;
		const iframeElement = await this.page.$( fullSelector );
		const iframe = await iframeElement.contentFrame();

		return await iframe.fill( what, value, { delay: 10 } );
	}
}
