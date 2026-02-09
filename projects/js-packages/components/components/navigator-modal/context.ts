import { createContext } from '@wordpress/element';
import type { TNavigatorModalContext } from './types.ts';

const initialContextValue: TNavigatorModalContext = {
	onClose: () => {},
};

export const NavigatorModalContext = createContext( initialContextValue );

NavigatorModalContext.displayName = 'NavigatorModalContext';
