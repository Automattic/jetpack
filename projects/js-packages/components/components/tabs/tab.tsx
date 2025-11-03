/**
 * External dependencies
 */
import { Tabs as BaseUITabs } from '@base-ui-components/react/tabs';
/**
 * WordPress dependencies
 */
import { chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
import { forwardRef, cloneElement } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import type { TabProps } from './types.ts';

const ChevronRight = ( props: React.SVGProps< SVGSVGElement > ) => {
	return cloneElement( chevronRight, props );
};

/**
 * An individual interactive tab button that toggles the corresponding panel.
 *
 * `Tabs` is a collection of React components that combine to render
 * an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 */
export const Tab = forwardRef< HTMLButtonElement, TabProps >( function Tab(
	{ className, children, ...otherProps },
	forwardedRef
) {
	return (
		<BaseUITabs.Tab
			ref={ forwardedRef }
			className={ clsx( styles.tab, className ) }
			{ ...otherProps }
		>
			<span className={ styles.tab__children }>{ children }</span>
			<ChevronRight className={ styles.tab__chevron } />
		</BaseUITabs.Tab>
	);
} );
