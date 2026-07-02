/**
 * External dependencies
 */
import { Link } from '@wordpress/route';
import { Link as ExternalLink, Text } from '@wordpress/ui';
import { useContext } from 'react';
import { WidgetRootContext } from '../widget-root/context';
import type { ComponentProps, ReactNode } from 'react';

type PostStatsLinkProps = {
	/**
	 * The post/page ID to open the detail view for. Must resolve to a positive
	 * integer; anything else falls back to the external link (or plain text).
	 */
	postId?: string | number;
	/**
	 * External URL of the published post/page. Used as the fallback target when
	 * in-app navigation is unavailable (Storybook, tests). Omit it to fall back
	 * to plain, non-linked text instead.
	 */
	href?: string;
	/**
	 * Post-detail tab to open on arrival (the `?section=` param), e.g.
	 * `email-opens`. Omit to land on the default tab.
	 */
	section?: string;
	/**
	 * Accessible title/tooltip for the link.
	 */
	title?: string;
	/**
	 * Class applied to the rendered element.
	 */
	className?: string;
	/**
	 * The link label.
	 */
	children: ReactNode;
};

/**
 * Coerce a post ID to the positive-integer string the `/post/$postId` route
 * accepts, or `null` when it is not a valid post reference.
 *
 * @param postId - The candidate post/page ID.
 * @return The normalized ID string, or null.
 */
function normalizePostId( postId?: string | number ): string | null {
	if ( postId === undefined ) {
		return null;
	}
	const id = String( postId );
	return /^\d+$/.test( id ) && Number( id ) > 0 ? id : null;
}

/**
 * Client-side link into the post/page detail view. Split out so the
 * router-only `@wordpress/route` `Link` is mounted only when a router exists;
 * the outer component decides that before rendering this one.
 *
 * @param props           - Component props.
 * @param props.postId    - Validated post/page ID.
 * @param props.section   - Optional post-detail tab to open.
 * @param props.title     - Accessible title/tooltip.
 * @param props.className - Class applied to the anchor.
 * @param props.children  - The link label.
 * @return The rendered in-app link.
 */
function InAppPostStatsLink( {
	postId,
	section,
	title,
	className,
	children,
}: {
	postId: string;
	section?: string;
	title?: string;
	className?: string;
	children: ReactNode;
} ) {
	/*
	 * The router is built dynamically, so `/post/$postId` has no statically-typed
	 * params/search schema (tanstack widens them to `never`). Cast the props the
	 * same way the routing package does when it writes the URL. `search` carries
	 * the current date range and comparison state through unchanged.
	 */
	const linkProps = {
		to: '/post/$postId',
		params: { postId },
		search: ( prev: Record< string, unknown > ) => ( {
			...prev,
			...( section ? { section } : {} ),
		} ),
		className,
		title,
	} as unknown as ComponentProps< typeof Link >;

	return <Link { ...linkProps }>{ children }</Link>;
}

/**
 * Links a post/page label to its single-post detail view inside the dashboard.
 *
 * When rendered under the SPA router, it navigates client-side to
 * `/post/$postId`, preserving the current date range and comparison state (and
 * optionally opening a specific `section` tab). Outside a router — Storybook,
 * unit tests — it degrades to the external published-post link, or to plain
 * text when no `href` is given.
 *
 * @param {PostStatsLinkProps} props - The component props.
 * @return The rendered link.
 */
export function PostStatsLink( {
	postId,
	href,
	section,
	title,
	className,
	children,
}: PostStatsLinkProps ) {
	// Read the context directly rather than through `useWidgetRootContext`, which
	// throws when there is no provider: presentational stories render the
	// leaderboard (and this link) outside a `WidgetRoot`, and should fall back to
	// the external link there rather than error.
	const isRouterAvailable = useContext( WidgetRootContext )?.isRouterAvailable ?? false;
	const normalizedId = normalizePostId( postId );

	if ( isRouterAvailable && normalizedId ) {
		return (
			<InAppPostStatsLink
				postId={ normalizedId }
				section={ section }
				title={ title }
				className={ className }
			>
				{ children }
			</InAppPostStatsLink>
		);
	}

	if ( href ) {
		return (
			<ExternalLink
				className={ className }
				href={ href }
				variant="unstyled"
				openInNewTab
				title={ title }
			>
				{ children }
			</ExternalLink>
		);
	}

	return (
		<Text className={ className } title={ title }>
			{ children }
		</Text>
	);
}
