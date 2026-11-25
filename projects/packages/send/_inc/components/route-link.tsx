import { useCallback } from '@wordpress/element';
import { useNavigate } from '@wordpress/route';
import { Link } from '@wordpress/ui';
import { adminHref } from '../data/log-link';
import type { MouseEvent, ReactNode } from 'react';

export type RouteLinkProps = {
	/** In-app href, like `/log?entry=12`. */
	href: string;
	children: ReactNode;
	className?: string;
	/** Tooltip text. */
	title?: string;
	/** A row title: no colour or underline until hover. */
	plain?: boolean;
};

/**
 * A link that opens an in-app route without a reload, and still works in a new tab.
 *
 * @param props           - Component props.
 * @param props.href      - In-app href.
 * @param props.children  - The label.
 * @param props.className - Extra class.
 * @param props.title     - Tooltip text.
 * @param props.plain     - A row title: no colour or underline until hover.
 * @return The link.
 */
export const RouteLink = ( {
	href,
	children,
	className,
	title,
	plain = false,
}: RouteLinkProps ) => {
	const navigate = useNavigate();
	const onClick = useCallback(
		( event: MouseEvent< HTMLAnchorElement > ) => {
			if ( event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0 ) {
				return;
			}
			event.preventDefault();
			navigate( { href } );
		},
		[ navigate, href ]
	);
	return (
		<Link
			tone="neutral"
			variant={ plain ? 'unstyled' : 'default' }
			href={ adminHref( href ) }
			onClick={ onClick }
			className={ className }
			title={ title }
		>
			{ children }
		</Link>
	);
};

export default RouteLink;
