/**
 * External dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import type { ReactNode } from 'react';

// The route provides the footer: a script module can't bundle `JetpackFooter`'s Sass.
const PageFooterContext = createContext< ReactNode >( null );

export const PageFooterProvider = PageFooterContext.Provider;

/**
 * The footer the route asked the report page shell to render last.
 *
 * @return The footer, or null when the route provides none.
 */
export function usePageFooter(): ReactNode {
	return useContext( PageFooterContext );
}
