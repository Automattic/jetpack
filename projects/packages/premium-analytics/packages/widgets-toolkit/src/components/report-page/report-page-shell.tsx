/**
 * External dependencies
 */
import { Page } from '@wordpress/admin-ui';
import clsx from 'clsx';
import styles from './report-page-shell.module.scss';
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */

export type ReportPageShellProps = ComponentProps< typeof Page > & {
	tabbed?: boolean;
};

/**
 * The shared outer shell for report pages, including the scrollable content
 * area and its alignment with the WordPress admin page header.
 *
 * @param {ReportPageShellProps} props - The component props.
 * @return The report page shell.
 */
export function ReportPageShell( {
	tabbed,
	className,
	children,
	...pageProps
}: ReportPageShellProps ) {
	return (
		<Page { ...pageProps } className={ clsx( styles.page, className ) }>
			<div className={ clsx( styles.content, tabbed && styles.contentFlush ) }>{ children }</div>
		</Page>
	);
}
