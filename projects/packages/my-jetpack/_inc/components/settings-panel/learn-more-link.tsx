import { Link } from '@wordpress/ui';
import { useCallback } from 'react';
import { useSettingsPanelTracking } from './use-settings-panel-tracking';
import type { ReactNode } from 'react';

/**
 * A panel's "Learn more" support link, recorded as the old Settings screen recorded it.
 *
 * @param props          - Component props.
 * @param props.module   - The module or settings entry slug.
 * @param props.href     - The support URL.
 * @param props.children - The link text.
 * @return The link.
 */
export function LearnMoreLink( {
	module,
	href,
	children,
}: {
	module: string;
	href: string;
	children: ReactNode;
} ) {
	const { trackClick } = useSettingsPanelTracking( module );
	const onClick = useCallback(
		() => trackClick( { target: 'learn-more', feature: module } ),
		[ module, trackClick ]
	);

	return (
		<Link href={ href } target="_blank" rel="noopener noreferrer" onClick={ onClick }>
			{ children }
		</Link>
	);
}
