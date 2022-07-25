import { derived } from 'svelte/store';
import config from '../stores/config';

export const hasPrioritySupport = derived( config, $config => $config.preferences.prioritySupport );

export const openPaidSupport = () => {
	const supportUrl = 'https://jetpackme.wordpress.com/contact-support/';
	window.open( supportUrl, '_blank' );
};
