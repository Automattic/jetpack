/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndType, waitForSelector, waitAndClick, isEventuallyVisible } from '../../page-helper';

export default class CheckoutPage extends Page {
	constructor( page ) {
		const expectedSelector = '.checkout__content .wp-checkout__review-order-step';
		super( page, { expectedSelector } );
	}

	async processPurchase( cardCredentials ) {
		// Enter billing info
		await this.page.select( `select#country-selector`, cardCredentials.cardCountryCode );
		await waitAndType( this.page, '#contact-postal-code', cardCredentials.cardPostCode, {
			delay: 10,
		} );
		await waitAndClick( this.page, '.checkout-step.is-active .checkout-button' );

		// Pick a payment method
		const isExistingCard = await isEventuallyVisible(
			this.page,
			'label[for*="existingCard"]',
			2000
		);

		if ( ! isExistingCard ) {
			await waitAndClick( this.page, 'label[for="card"]' );
			await this.enterTestCreditCardDetails( cardCredentials );
		}

		await this.submitPaymentDetails();
		return await this.waitToDisappear();
	}

	async enterTestCreditCardDetails( { cardHolder, cardNumber, cardExpiry, cardCVV } ) {
		await waitAndType( this.page, '#cardholder-name', cardHolder, { delay: 10 } );

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

		await waitAndClick( this.page, paymentButtonSelector );
		return await this.waitForPaymentProcessing();
	}

	async waitForPaymentProcessing() {
		const progressBarSelector = '.checkout-submit-button .is-busy';
		await waitForSelector( this.page, progressBarSelector );
		await waitForSelector( this.page, progressBarSelector, {
			hidden: true,
			timeout: 3 * 30000,
		} );
	}

	async waitToDisappear() {
		return await waitForSelector( this.page, this.expectedSelector, {
			hidden: true,
			timeout: 5 * 30000,
		} );
	}

	// Switches to credit-card specific iframe and type the value into relative input
	async waitAndTypeInIframe( iframeSelector, what, value ) {
		const fullSelector = `.credit-card-form-fields ${ iframeSelector } iframe`;
		const iframeElement = await page.$( fullSelector );
		const iframe = await iframeElement.contentFrame();

		return await waitAndType( iframe, what, value, { delay: 10 } );
	}
}
