import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { decideInitialView, isAllTasksMode, type View } from './lib/orchestration.ts';
import { TailoredList } from './tailored-list/tailored-list.tsx';
import { Wizard } from './wizard/wizard.tsx';
import type { TailorResult } from './lib/types.ts';
import type { LaunchpadData } from './tailored-list/model.ts';

/**
 * Orchestrates the AI Launchpad flow: new users see the wizard, returning users
 * land straight on the tailored list.
 *
 * @return The orchestrated AI Launchpad element.
 */
export function App() {
	// null while the initial read is in flight.
	const [ view, setView ] = useState< View | null >( null );
	const [ pendingTailor, setPendingTailor ] = useState< Promise< TailorResult > | undefined >();
	// Handed to the list so returning users don't refetch the same endpoint.
	const [ initialData, setInitialData ] = useState< LaunchpadData | undefined >();

	useEffect( () => {
		let cancelled = false;
		// Testing aid: ?all_tasks=1 skips the wizard and renders the full catalog.
		const allTasks = isAllTasksMode( window.location.search );
		const path = allTasks ? '/wpcom/v2/ai-launchpad?all_tasks=1' : '/wpcom/v2/ai-launchpad';
		apiFetch< LaunchpadData >( { path } ).then( data => {
			if ( cancelled ) {
				return;
			}
			setInitialData( data );
			setView( allTasks ? 'list' : decideInitialView( data ) );
		} );
		return () => {
			cancelled = true;
		};
	}, [] );

	if ( view === null ) {
		return null;
	}

	if ( view === 'wizard' ) {
		return (
			<Wizard
				initialSiteName={ initialData?.site?.title }
				initialIntent={ initialData?.site?.description }
				siteUrl={ initialData?.site?.url }
				onComplete={ ( input, tailoring ) => {
					setPendingTailor( () => tailoring );
					// The wizard wrote the entered Name to blogname; keep the preview
					// card's title in sync without refetching. Mirrors the server's
					// guard: an empty/whitespace Name never overwrites the title.
					const siteName = input.site_name.trim();
					if ( siteName ) {
						setInitialData( data =>
							data?.site ? { ...data, site: { ...data.site, title: siteName } } : data
						);
					}
					setView( 'list' );
				} }
			/>
		);
	}

	// After the wizard the list runs the fresh tailor flow; returning users render
	// from initialData. Site is passed either way so the skeleton can show the preview.
	return (
		<TailoredList
			pendingTailor={ pendingTailor }
			initialData={ pendingTailor ? undefined : initialData }
			site={ initialData?.site }
		/>
	);
}
