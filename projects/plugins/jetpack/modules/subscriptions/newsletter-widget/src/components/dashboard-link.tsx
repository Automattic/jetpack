import { Link } from '@wordpress/ui';
import { createTracksEventHandler } from '../helpers';
import type { TracksEventRecorder } from '../helpers';
import type { ReactNode } from 'react';

type DashboardLinkProps = {
	internal: boolean;
	href: string;
	eventName: string;
	tracks: TracksEventRecorder;
	children?: ReactNode;
};

/**
 * Link that records a click. External links open in a new tab.
 *
 * @param {DashboardLinkProps} props - Component props.
 * @returns {import('react').JSX.Element} The link.
 */
export const DashboardLink = ( {
	internal,
	href,
	eventName,
	tracks,
	children,
}: DashboardLinkProps ) => {
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
