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
		await waitAndType( this.page, '#number', cardNumber, { delay: 10 } );
		await waitAndType( this.page, '#expiration-date', cardExpiry, { delay: 10 } );
		await waitAndType( this.page, '#cvv', cardCVV, { delay: 10 } );
		await this.page.select( `div.country select`, cardCountryCode );
		return await waitAndType( this.page, '#postal-code', cardPostCode, { delay: 10 } );
	}

	async submitPaymentDetails() {
		const disabledPaymentButton = '.credit-card-payment-box button[disabled]';
		const paymentButtonSelector = '.credit-card-payment-box button.is-primary:not([disabled])';

		await waitForSelector( this.page, disabledPaymentButton, { hidden: true } );
		await waitAndClick( this.page, paymentButtonSelector );
		return await this.waitForPaymentProcessing();
	}

	async waitForPaymentProcessing() {
		const paymentButtonSelector = '.credit-card-payment-box button.is-primary:not([disabled])';
		const progressBarSelector = '.checkout__credit-card-payment-box-progress-bar';
		await waitForSelector( this.page, progressBarSelector, { hidden: true, timeout: 3 * 30000 } );
		// For some reason first purchase attempt fails quite often. Going to try for a second time.
		if ( ! this.paymentFailed && this.page.$( paymentButtonSelector ) ) {
			this.paymentFailed = true;
			// eslint-disable-next-line no-console
			console.log( 'First payment attempt failed. Trying one more time!' );
			return this.submitPaymentDetails();
		}
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
}
