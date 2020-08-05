/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const Context = createContext( {
	activeTab: 'one-time',
} );

export default Context;
