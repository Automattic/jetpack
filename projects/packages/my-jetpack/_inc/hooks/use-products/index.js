/* global myJetpackInitialState */
/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import useMyJetpackConnection from '../use-my-jetpack-connection';

/**
 * React custom hook to access some products information.
 *
 * @returns {Object} productsThatRequiresUserConnection, productsWithActivePlugin, disconnectedAndOnePluginInstalled.
 */
export default function useProducts() {
	const { isSiteConnected } = useMyJetpackConnection();

	const productsThatRequiresUserConnection = useSelect( select =>
		select( STORE_ID ).getProductsThatRequiresUserConnection()
	);

	const productsWithActivePlugin = getProductsWithActivePlugin();

	const disconnectedAndOnePluginInstalled =
		! isSiteConnected && productsWithActivePlugin.length === 1;

	return {
		productsThatRequiresUserConnection,
		productsWithActivePlugin,
		disconnectedAndOnePluginInstalled,
	};
}

/**
 * Gets the list of products for which the plugins are installed
 *
 * @returns {Array} List of product slugs
 */
function getProductsWithActivePlugin() {
	const { productsWithActivePlugin } = myJetpackInitialState;
	/**
	 * For the sake of this test, let's not consider anti-spam.
	 * Akismet comes pre-installed with every site and does not require a connection.
	 * We want to make sure we have a coherent onboarding for stand-alone plugins that require a connection.
	 */
	const antiSpamIndex = productsWithActivePlugin.indexOf( 'anti-spam' );
	if ( antiSpamIndex > -1 ) {
		productsWithActivePlugin.splice( antiSpamIndex, 1 );
	}
	return productsWithActivePlugin;
}
