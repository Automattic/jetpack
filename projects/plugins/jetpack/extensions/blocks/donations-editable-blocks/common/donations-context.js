/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEFAULT_TAB } from './constants';

const defaultContext = {
	activeTab: DEFAULT_TAB,
};

const DonationsContext = createContext( defaultContext );

export default DonationsContext;
