import { getRedirectUrl } from '@automattic/jetpack-components';
import { Link } from '@wordpress/ui';
import type { ReactNode } from 'react';

/**
 * A link to the Safe Mode support page, in a new tab.
 *
 * @param {object}    props          - Component props.
 * @param {ReactNode} props.children - The link text, filled in by `createInterpolateElement()`.
 * @return {ReactNode} The link.
 */
export default function SupportLink( { children }: { children?: ReactNode } ): ReactNode {
	return (
		// `Link` sets no `rel` for a new tab.
		<Link
			href={ getRedirectUrl( 'jetpack-support-safe-mode' ) }
			openInNewTab
			rel="noopener noreferrer"
		>
			{ children }
		</Link>
	);
}
