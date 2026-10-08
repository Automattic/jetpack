import { useCallback } from '@wordpress/element';
import { Link } from '@wordpress/ui';
import type { MouseEvent, ReactNode } from 'react';

/** Matches `Automattic\Jetpack\Protect\Dashboard::MENU_SLUG`. */
export const PROTECT_PAGE_SLUG = 'jetpack-protect';

/**
 * A link to a dashboard tab that switches tabs in place, and still opens in a new tab when asked.
 *
 * @param props          - Component props.
 * @param props.tab      - The tab's value, such as "settings".
 * @param props.onOpen   - Switches to the tab.
 * @param props.children - The link text.
 * @return The link.
 */
export default function TabLink( {
	tab,
	onOpen,
	children,
}: {
	tab: string;
	onOpen: ( tab: string ) => void;
	children: ReactNode;
} ) {
	const onClick = useCallback(
		( event: MouseEvent< HTMLAnchorElement > ) => {
			if ( event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0 ) {
				return;
			}
			event.preventDefault();
			onOpen( tab );
		},
		[ onOpen, tab ]
	);

	return (
		<Link
			href={ `admin.php?page=${ PROTECT_PAGE_SLUG }&p=${ encodeURIComponent( `/?tab=${ tab }` ) }` }
			onClick={ onClick }
		>
			{ children }
		</Link>
	);
}
