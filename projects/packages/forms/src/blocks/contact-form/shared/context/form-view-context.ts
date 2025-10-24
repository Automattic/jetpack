/**
 * External dependencies
 */
import { createContext } from '@wordpress/element';

// Form View Context for sharing view state with child blocks
export const FormViewContext = createContext( {
	isPostSubmitView: false,
	switchToFormView: () => {},
	switchToPostSubmitView: () => {},
	confirmationType: 'text',
} );
