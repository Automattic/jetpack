// Ported from wp-calypso client/lib/analytics/page-view-tracker.
import { useEffect } from 'react';
import { recordPageView } from '../../analytics';

export interface PageViewTrackerProps {
	path: string;
	title: string;
	properties?: Record< string, unknown >;
}

/**
 * Record a `calypso_page_view` on mount and whenever `path` changes.
 *
 * @param props            - Component props.
 * @param props.path       - Route path, with placeholders.
 * @param props.title      - Page title.
 * @param props.properties - Extra properties.
 * @return Nothing.
 */
export default function PageViewTracker( { path, title, properties }: PageViewTrackerProps ) {
	useEffect( () => {
		recordPageView( path, title, properties );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Calypso only records again on a path change.
	}, [ path ] );
	return null;
}
