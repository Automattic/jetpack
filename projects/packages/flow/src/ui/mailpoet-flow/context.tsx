import { __unstableUseCompositeState as useCompositeState } from '@wordpress/components';
import { createContext } from '@wordpress/element';

type AutomationContextType = { context: 'edit' | 'view' };

export const AutomationContext = createContext< AutomationContextType >( undefined );

export const AutomationCompositeContext =
	createContext< ReturnType< typeof useCompositeState > >( undefined );
