/**
 * External dependencies
 */
import { Page } from '@wordpress/admin-ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './detail-page-shell.module.scss';
import type { ComponentProps } from 'react';

export type DetailPageShellProps = ComponentProps< typeof Page >;

/**
 * The shared outer shell for the resource detail pages: the admin page header
 * over a body its own child scrolls, rather than the page.
 *
 * @param {DetailPageShellProps} props - The component props.
 * @return The detail page shell.
 */
export function DetailPageShell( { className, children, ...pageProps }: DetailPageShellProps ) {
	return (
		<Page { ...pageProps } className={ clsx( styles.page, className ) }>
			{ children }
		</Page>
	);
}
