// Ported from wp-calypso client/lib/analytics/page-view-tracker.
import { useEffect, useRef } from 'react';
import { recordTracksEventNow } from '../../analytics';

type Properties = Record< string, unknown >;

export type PageViewRecorder = (
	path: string,
	title: string,
	group?: string,
	properties?: Properties,
	options?: Properties
) => void;

export interface PageViewTrackerProps {
	path: string;
	title: string;
	delay?: number;
	properties?: Properties;
	options?: Properties;
	recorder?: PageViewRecorder;
	hasSelectedSiteLoaded?: boolean;
	selectedSiteId?: number | null;
	isUserAuthenticated?: unknown;
}

const defaultRecorder: PageViewRecorder = ( path, title, _group, properties ) =>
	recordTracksEventNow( 'calypso_page_view', { path, title, ...properties } );

/**
 * Record a page view on mount and whenever `path` or `selectedSiteId` changes.
 *
 * @param props                       - Component props.
 * @param props.path
 * @param props.title
 * @param props.delay
 * @param props.properties
 * @param props.options
 * @param props.recorder
 * @param props.hasSelectedSiteLoaded
 * @param props.selectedSiteId
 * @param props.isUserAuthenticated
 * @return Nothing.
 */
export function UnconnectedPageViewTracker( {
	path,
	title,
	delay = 0,
	properties,
	options,
	recorder = defaultRecorder,
	hasSelectedSiteLoaded = true,
	selectedSiteId,
	isUserAuthenticated,
}: PageViewTrackerProps ) {
	const timer = useRef< ReturnType< typeof setTimeout > | null >( null );
	const latest = useRef( { title, properties, options, recorder } );
	latest.current = { title, properties, options, recorder };

	useEffect( () => {
		// Wait for the selected site, unless logged out; once a delayed view is queued, Calypso never queues another.
		if ( ( ! hasSelectedSiteLoaded && isUserAuthenticated ) || timer.current ) {
			return;
		}
		const { title: t, properties: p, options: o, recorder: record } = latest.current;
		if ( ! delay ) {
			record( path, t, 'default', p, o );
			return;
		}
		timer.current = setTimeout( () => record( path, t, 'default', p, o ), delay );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Calypso only re-queues on path or site changes.
	}, [ path, selectedSiteId ] );

	useEffect(
		() => () => {
			if ( timer.current ) {
				clearTimeout( timer.current );
			}
		},
		[]
	);

	return null;
}

/**
 * Page view tracker that records `calypso_page_view` through Tracks.
 *
 * @param props - Component props.
 * @return Nothing.
 */
export default function PageViewTracker( props: PageViewTrackerProps ) {
	return <UnconnectedPageViewTracker { ...props } />;
}
