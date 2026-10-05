import { useCallback } from '@wordpress/element';
import { Link } from '@wordpress/ui';
import type { MouseEvent, ReactNode } from 'react';

const SETTINGS_URL = 'admin.php?page=jetpack-protect&p=%2F%3Ftab%3Dsettings';

/**
 * A link to the Settings tab that switches tabs in place, and still opens in a new tab when asked.
 *
 * @param props          - Component props.
 * @param props.onOpen   - Switches to the Settings tab.
 * @param props.children - The link text.
 * @return The link.
 */
export default function SettingsLink( {
	onOpen,
	children,
}: {
	onOpen: () => void;
	children: ReactNode;
} ) {
	const onClick = useCallback(
		( event: MouseEvent< HTMLAnchorElement > ) => {
			if ( event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0 ) {
				return;
			}
			event.preventDefault();
			onOpen();
		},
		[ onOpen ]
	);

	return (
		<Link href={ SETTINGS_URL } onClick={ onClick }>
			{ children }
		</Link>
	);
}
