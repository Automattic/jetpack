import WpPage from '../wp-page.js';

export default class InPlaceAuthorizeFrame extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ 'iframe.jp-jetpack-connect__iframe' ] } );
	}

	static async init( page ) {
		const loadingSelector = '.jp-connect-full__button-container-loading';
		const thisPage = new this( page );
		await thisPage.waitForElementToBeHidden( loadingSelector, 35000 );
		return thisPage;
	}

	async getFrame() {
		const iframeElement = await this.waitForElementToBeVisible( this.selectors[ 0 ] );
		return await iframeElement.contentFrame();
	}

	async approve() {
		const approveSelector = 'button#approve';
		const iframe = await this.getFrame();
		await iframe.click( approveSelector );
		return this.waitToDisappear();
	}

	async continueWithout() {
		const continueSelector = '#jp-authenticate-no_user_test_mode a.jp-no-user-mode-button';
		const iframe = await this.getFrame();
		await iframe.click( continueSelector );
		return this.waitToDisappear();
	}

	async waitToDisappear() {
		return await this.waitForElementToBeHidden( this.selectors[ 0 ], 40000 );
	}
}
