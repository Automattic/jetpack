import config from '../stores/config';

export const hasPrioritySupport = config.preferences.prioritySupport;

export const openPaidSupport = () => {
	const supportUrl = 'https://jetpackme.wordpress.com/contact-support/';
	window.open( supportUrl, '_blank' );
};

export const SupportUrl = getSupportUrl();

function getSupportUrl() {
	if ( hasPrioritySupport ) {
		return 'https://jetpackme.wordpress.com/contact-support/';
	}
	return 'https://wordpress.org/support/plugin/jetpack-boost/#new-topic-0';
}
