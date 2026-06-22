import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { decideInitialView, type View } from './lib/orchestration.ts';
import { TailoredList } from './tailored-list/tailored-list.tsx';
import { Wizard } from './wizard/wizard.tsx';
import type { TailorResult } from './lib/types.ts';
import type { LaunchpadData } from './tailored-list/model.ts';

/**
 * Orchestrates the AI Launchpad flow: a new user (no persisted AI output) sees
 * the wizard, finishes it, and transitions to the tailored list; a returning
 * user (output already persisted) lands straight on the tailored list.
 *
 * On load it reads `GET /ai-launchpad` once to decide the view. When the wizard
 * finishes it hands the in-flight tailor promise to the list, which shows the
 * skeleton until the AI call and its PUT settle, then renders the six tasks.
 *
 * View selection uses local React state (no `@wordpress/data` store), matching
 * the wizard and tailored-list streams.
 *
 * @return The orchestrated AI Launchpad element.
 */
export function App() {
	// `null` while the initial read is in flight; the skeleton-free wizard and
	// list both decide their own loading UI once a view is chosen.
	const [ view, setView ] = useState< View | null >( null );
	const [ pendingTailor, setPendingTailor ] = useState< Promise< TailorResult > | undefined >();
	// The composite read used to decide the view; handed to the list so a
	// returning user doesn't fetch the same expensive endpoint twice.
	const [ initialData, setInitialData ] = useState< LaunchpadData | undefined >();

	useEffect( () => {
		let cancelled = false;
		apiFetch< LaunchpadData >( { path: '/wpcom/v2/ai-launchpad' } ).then( data => {
			if ( cancelled ) {
				return;
			}
			setInitialData( data );
			setView( decideInitialView( data ) );
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
				onComplete={ ( _input, tailoring ) => {
					setPendingTailor( () => tailoring );
					setView( 'list' );
				} }
			/>
		);
	}

	// After the wizard, the list runs the fresh tailor flow (initialData would be
	// the pre-wizard read); returning users render straight from initialData. The
	// site context is path-independent, so it's passed either way — that lets the
	// loading skeleton show the site preview before the tailored read lands.
	return (
		<TailoredList
			pendingTailor={ pendingTailor }
			initialData={ pendingTailor ? undefined : initialData }
			site={ initialData?.site }
		/>
	);
}
