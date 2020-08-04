/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const Context = createContext( {
	currency: 'USD',
	showCustomAmount: true,
} );

export default Context;
