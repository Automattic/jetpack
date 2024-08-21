import logger from 'jetpack-e2e-commons/logger.js';
import { AuthorizePage } from 'jetpack-e2e-commons/pages/wpcom/index.js';
import { JetpackSocialPage } from '../pages/index.js';

/**
 * Connect Jetpack Social
 * @param {page}    page    - Playwright page object
 * @param {boolean} premium - Whether to connect with a Premium plan
 */
export async function connect( page, premium = false ) {
	logger.step( 'Connect Jetpack Social' );

	let socialPage = await JetpackSocialPage.visit( page );
	await socialPage.getStarted();
	await ( await AuthorizePage.init( page ) ).approve( { redirectUrl: socialPage.url } );
	socialPage = await JetpackSocialPage.init( page );

	if ( premium ) {
		await socialPage.getSocial();
		// todo add purchase steps
	} else {
		await socialPage.startForFree();
	}
}
