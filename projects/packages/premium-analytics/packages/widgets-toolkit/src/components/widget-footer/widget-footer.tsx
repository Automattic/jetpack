/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './widget-footer.module.scss';
import type { ReactNode } from 'react';

export type WidgetFooterProps = {
	children: ReactNode;

	/**
	 * Optional class for widget-specific layout tweaks.
	 */
	className?: string;
};

/**
 * Layout container for content displayed below a widget body.
 */
export function WidgetFooter( { children, className }: WidgetFooterProps ) {
	return <div className={ clsx( styles.footer, className ) }>{ children }</div>;
}
