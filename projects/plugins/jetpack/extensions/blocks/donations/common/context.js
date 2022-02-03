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
	fallbackLinkUrl: '',
	products: [],
	currency: '',
	showCustomAmount: true,
};

const Context = createContext( defaultContext );

export default Context;
