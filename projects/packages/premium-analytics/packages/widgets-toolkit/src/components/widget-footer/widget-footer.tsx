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
	/**
	 * Footer content.
	 */
	children: ReactNode;

	/**
	 * Optional class for widget-specific layout tweaks.
	 */
	className?: string;
};

/**
 * Layout container for content displayed below a widget body.
 *
 * @param props           - Component props.
 * @param props.children  - Footer content.
 * @param props.className - Optional additional class name.
 * @return The rendered widget footer.
 */
export function WidgetFooter( { children, className }: WidgetFooterProps ) {
	return <div className={ clsx( styles.footer, className ) }>{ children }</div>;
}
