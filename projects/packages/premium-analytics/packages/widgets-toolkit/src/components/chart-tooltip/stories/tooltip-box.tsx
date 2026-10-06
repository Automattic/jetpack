import { BaseTooltip } from '@jetpack-premium-analytics/externals';
import type { ReactNode } from 'react';

const IN_FLOW = { position: 'static', transform: 'none' } as const;

/**
 * The charts tooltip box, taken out of its absolute position so a story can center it.
 *
 * @param props          - Component props
 * @param props.children - The tooltip content
 */
export const TooltipBox = ( { children }: { children: ReactNode } ) => (
	<BaseTooltip top={ 0 } left={ 0 } style={ IN_FLOW }>
		{ children }
	</BaseTooltip>
);
