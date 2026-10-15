import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Link } from '@wordpress/ui';
import { createTracksEventHandler } from '../helpers';
import type { ReactNode } from 'react';

type DashboardLinkProps = {
	internal: boolean;
	href: string;
	eventName: string;
	children?: ReactNode;
};

/**
 * Link that records a click. External links open in a new tab.
 *
 * @param {DashboardLinkProps} props - Component props.
 * @return {import('react').JSX.Element} The link.
 */
export const DashboardLink = ( { internal, href, eventName, children }: DashboardLinkProps ) => {
	const { tracks } = useAnalytics();
	const onClick = createTracksEventHandler( tracks, eventName );

	if ( ! internal ) {
		return (
			<Link href={ href } openInNewTab onClick={ onClick }>
				{ children }
			</Link>
		);
	}

	return (
		<a href={ href } onClick={ onClick }>
			{ children }
		</a>
	);
};
