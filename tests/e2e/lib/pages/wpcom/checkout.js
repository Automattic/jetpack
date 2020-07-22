/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndType, waitForSelector, waitAndClick, isEventuallyVisible } from '../../page-helper';

export default class CheckoutPage extends Page {
	constructor( page ) {
		const expectedSelector = '.checkout__secure-payment-form';
		super( page, { expectedSelector } );
	}

	async processPurchase( cardDetails ) {
		await this.payWithStoredCardIfPossible( cardDetails );
		await this.submitPaymentDetails();
		return await this.waitToDisappear();
	}

	async enterTestCreditCardDetails( {
		cardHolder,
		cardNumber,
		cardExpiry,
		cardCVV,
		cardCountryCode,
		cardPostCode,
	} ) {
		await waitAndType( this.page, '#name', cardHolder, { delay: 10 } );

		await this.waitAndTypeInIframe( '.number', "input[name='cardnumber']", cardNumber );
		await this.waitAndTypeInIframe( '.cvv', "input[name='cvc']", cardCVV );
		await this.waitAndTypeInIframe( '.expiration-date', "input[name='exp-date']", cardExpiry );

		await this.page.select( `div.country select`, cardCountryCode );
		return await waitAndType( this.page, '#postal-code', cardPostCode, {
			delay: 10,
		} );
	}

	async submitPaymentDetails() {
		const disabledPaymentButton = '.credit-card-payment-box button[disabled]';
		const paymentButtonSelector = '.credit-card-payment-box button.is-primary:not([disabled])';

		await waitForSelector( this.page, disabledPaymentButton, {
			hidden: true,
		} );
		await waitAndClick( this.page, paymentButtonSelector );
		return await this.waitForPaymentProcessing();
	}

	async waitForPaymentProcessing() {
		const progressBarSelector = '.checkout__credit-card-payment-box-progress-bar';
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

	async payWithStoredCardIfPossible( cardCredentials ) {
		const storedCardSelector = '.credit-card__stored-card';
		if ( await isEventuallyVisible( this.page, storedCardSelector ) ) {
			return await waitAndClick( this.page, storedCardSelector );
		}
		await this.enterTestCreditCardDetails( cardCredentials );
	}

	// Switches to credit-card specific iframe and type the value into relative input
	async waitAndTypeInIframe( iframeSelector, what, value ) {
		const fullSelector = `.credit-card-form-fields ${ iframeSelector } iframe`;
		const iframeElement = await page.$( fullSelector );
		const iframe = await iframeElement.contentFrame();

		return await waitAndType( iframe, what, value, { delay: 10 } );
	}
}
