/**
 * External dependencies
 */
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';

export const getSupportLink = () => {
	return isSimpleSite() || isAtomicSite()
		? 'https://wordpress.com/support/video-tutorials-add-payments-features-to-your-site-with-our-guides/#how-to-use-the-payments-block-video'
		: 'https://jetpack.com/support/jetpack-blocks/payments-block/';
};
