/**
 * External dependencies
 */
import { Icon } from '@jetpack-premium-analytics/externals';
import { jetpack } from '@jetpack-premium-analytics/icons';
import { Page } from '@wordpress/admin-ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './report-page-shell.module.scss';
import type { ComponentProps } from 'react';

export type ReportPageShellProps = ComponentProps< typeof Page >;

/**
 * The shared outer shell for report pages: the admin page header over a body
 * its own child scrolls, rather than the page.
 *
 * @param {ReportPageShellProps} props - The component props.
 * @return The report page shell.
 */
export function ReportPageShell( {
	className,
	children,
	visual = <Icon icon={ jetpack } />,
	...pageProps
}: ReportPageShellProps ) {
	return (
		<Page { ...pageProps } className={ clsx( styles.page, className ) } visual={ visual }>
			{ children }
		</Page>
	);
}
