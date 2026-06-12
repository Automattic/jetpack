import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { decideInitialView, type OrchestrationData, type View } from './lib/orchestration.ts';
import { TailoredList } from './tailored-list/tailored-list.tsx';
import { Wizard } from './wizard/wizard.tsx';
import type { TailorResult } from './lib/types.ts';

const IS_DEV = process.env.NODE_ENV !== 'production';

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
	const [ view, setView ] = useState< View | null >( IS_DEV ? 'wizard' : null );
	const [ pendingTailor, setPendingTailor ] = useState< Promise< TailorResult > | undefined >();

	useEffect( () => {
		// In dev there is no server; start on the wizard so the whole flow is
		// exercisable, and the list renders from its committed fixture.
		if ( IS_DEV ) {
			return;
		}

		let cancelled = false;
		apiFetch< OrchestrationData >( { path: '/wpcom/v2/ai-launchpad' } ).then( data => {
			if ( cancelled ) {
				return;
			}
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
				onComplete={ ( _input, tailoring ) => {
					setPendingTailor( () => tailoring );
					setView( 'list' );
				} }
			/>
		);
	}

	return <TailoredList pendingTailor={ pendingTailor } />;
}
