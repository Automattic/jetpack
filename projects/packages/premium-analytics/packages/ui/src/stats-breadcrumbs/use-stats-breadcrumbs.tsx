/**
 * External dependencies
 */
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/route';
import clsx from 'clsx';
import styles from './stats-breadcrumbs.module.scss';
import type { Page } from '@wordpress/admin-ui';
import type { AnchorHTMLAttributes, ComponentProps } from 'react';

type PageProps = ComponentProps< typeof Page >;
type BreadcrumbItems = NonNullable< PageProps[ 'breadcrumbs' ] >;

export interface UseStatsBreadcrumbsOptions {
	/** Whether the root crumb is the dashboard's page heading. */
	isRoot?: boolean;
	/** Crumbs after the dashboard root; the last one becomes the page heading. */
	items?: BreadcrumbItems;
	/** The page's own class name, merged with the trail's. */
	className?: string;
}

/**
 * Renders the trail's links with the router, splitting the query string of `href` into `search`.
 *
 * @param props      - Anchor props.
 * @param props.href - Router path, optionally with a query string.
 * @return The router link.
 */
function RouterLink( {
	href,
	...props
}: AnchorHTMLAttributes< HTMLAnchorElement > & { href: string } ) {
	const [ to, query ] = href.split( '?' );
	const search = query ? Object.fromEntries( new URLSearchParams( query ) ) : undefined;

	// Router types aren't registered in this build, so `search` resolves to `never`.
	return <Link to={ to } search={ search as unknown as never } { ...props } />;
}

const COMPONENTS: PageProps[ 'components' ] = { link: RouterLink };

/**
 * The `Page` props for a Stats page's "Stats / …" breadcrumb trail; spread them onto `Page`.
 *
 * @param options           - Options.
 * @param options.isRoot    - Whether the root crumb is the dashboard's page heading.
 * @param options.items     - Crumbs after the dashboard root.
 * @param options.className - The page's own class name.
 * @return The `breadcrumbs`, `components`, and `className` props.
 */
export function useStatsBreadcrumbs( {
	isRoot = false,
	items = [],
	className,
}: UseStatsBreadcrumbsOptions = {} ): Pick<
	PageProps,
	'breadcrumbs' | 'components' | 'className'
> {
	const dashboardLink = useDashboardLink();

	return {
		breadcrumbs: [
			{
				label: __( 'Stats', 'jetpack-premium-analytics-pkg' ),
				// An unlinked final crumb is the page heading, so only the dashboard drops the link.
				...( isRoot ? {} : { href: dashboardLink } ),
			},
			...items,
		],
		components: COMPONENTS,
		className: clsx( styles.page, className ),
	};
}
