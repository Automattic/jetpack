import { AuthorizePage } from 'jetpack-e2e-commons/pages/wpcom/index.js';
import logger from 'jetpack-e2e-commons/logger.cjs';
import { JetpackSocialPage } from '../pages/index.js';

export async function connect( page, premium = false ) {
	logger.step( 'Connect Jetpack Social' );

	let socialPage = await JetpackSocialPage.visit( page );
	await socialPage.getStarted();
	await ( await AuthorizePage.init( page ) ).approve();
	socialPage = await JetpackSocialPage.init( page );

	if ( premium ) {
		socialPage.getSocial();
		// todo add purchase steps
	} else {
		socialPage.startForFree();
	}
}
