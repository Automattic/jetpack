/**
 * External dependencies
 */
import { Tabs as BaseUITabs } from '@base-ui-components/react/tabs';
import clsx from 'clsx';
import { forwardRef } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import type { TabPanelProps } from './types.ts';

/**
 * A panel displayed when the corresponding tab is active.
 *
 * `Tabs` is a collection of React components that combine to render
 * an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 */
export const Panel = forwardRef< HTMLDivElement, TabPanelProps >( function TabPanel(
	{ className, focusable = true, tabIndex, ...otherProps },
	forwardedRef
) {
	return (
		<BaseUITabs.Panel
			ref={ forwardedRef }
			tabIndex={ tabIndex ?? ( focusable ? 0 : -1 ) }
			className={ clsx( 'jp-forms-tabs__tabpanel', className ) }
			{ ...otherProps }
		/>
	);
} );
