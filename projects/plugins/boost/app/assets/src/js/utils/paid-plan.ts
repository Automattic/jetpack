/**
 * Internal dependencies
 */
import config from '../stores/config';

export const isPaidPlan = config.preferences.paidPlan;

export const openPaidSupport = () => {
	const supportUrl = 'https://jetpackme.wordpress.com/contact-support/';
	window.open( supportUrl, '_blank' );
};
