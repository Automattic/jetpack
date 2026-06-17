import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useState } from '@wordpress/element';
import devFixture from '../fixtures/dev-tailored-list.json';
import { createFirstPostDraft } from '../lib/first-post.ts';
import { createPatternPage } from '../lib/pattern-page.ts';
import { trackTaskClicked } from '../lib/tracks.ts';
import {
	firstIncompleteIndex,
	resolveCtaUrl,
	tasksFromFixture,
	type EnrichedTask,
	type LaunchpadData,
} from './model.ts';
import { TailoredListSkeleton } from './skeleton.tsx';
import { TaskCard } from './task-card.tsx';
import type { TailoredOutput, TailorResult } from '../lib/types.ts';

import './style.scss';

const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Navigate the browser to a task's deeplink (a Calypso path or wp-admin URL).
 *
 * @param url - The destination URL.
 */
function navigate( url: string ): void {
	window.location.href = url;
}

interface Props {
	// When the host transitions here straight from the wizard, the AI tailoring
	// is still in flight and its PUT /tailored has not necessarily landed. The
	// host passes the tailor promise so the list waits for it to settle before
	// reading GET /ai-launchpad — otherwise the GET races the PUT and returns an
	// empty task list. While awaiting, the skeleton shows. Its resolved result is
	// also used as a local fallback when the read yields nothing (e.g. the
	// fallback PUT failed). Omitted for returning users, where output is persisted.
	pendingTailor?: Promise< TailorResult >;
}

/**
 * The tailored launchpad list: six task cards rendered from the AI output. The
 * first incomplete task auto-expands; each task offers "Get started" and "Skip"
 * actions. While the AI output is loading, a six-card skeleton is shown.
 *
 * Titles, completion state, and deeplink paths come from Stream B's
 * `GET /ai-launchpad/`; subtitles come from the AI. In dev mode the list
 * renders from a committed fixture so it can be worked on before the AI call
 * exists.
 *
 * @param props               - Component props.
 * @param props.pendingTailor - In-flight tailor call to await before fetching.
 * @return The tailored-list element.
 */
export function TailoredList( { pendingTailor }: Props = {} ) {
	const [ tasks, setTasks ] = useState< EnrichedTask[] | null >( null );
	const [ output, setOutput ] = useState< TailoredOutput | null >( null );
	const [ expandedId, setExpandedId ] = useState< string | null >( null );
	const [ skippedIds, setSkippedIds ] = useState< Set< string > >( () => new Set() );
	const [ busyId, setBusyId ] = useState< string | null >( null );

	useEffect( () => {
		if ( IS_DEV ) {
			const fixture = devFixture as TailoredOutput;
			setOutput( fixture );
			setTasks( tasksFromFixture( fixture ) );
			return;
		}

		let cancelled = false;
		// When arriving from the wizard, wait for the tailor call to settle so the
		// PUT /tailored has persisted before we read it back; otherwise fetch now.
		Promise.resolve( pendingTailor )
			.then( async result => {
				try {
					const data = await apiFetch< LaunchpadData >( { path: '/wpcom/v2/ai-launchpad' } );
					if ( cancelled ) {
						return;
					}
					if ( data.tasks.length > 0 ) {
						setTasks( data.tasks );
						setOutput( data.ai_output?.payload ?? null );
						return;
					}
				} catch {
					// Read failed; fall through to the in-memory fallback below.
				}
				if ( cancelled ) {
					return;
				}
				// The read failed or returned nothing. If we just tailored, render the
				// in-memory result so the user still gets the deterministic list
				// (titles humanized, no deeplinks) instead of an empty screen.
				if ( result?.output ) {
					setOutput( result.output );
					setTasks( tasksFromFixture( result.output ) );
				} else {
					setTasks( [] );
				}
			} )
			.catch( () => {
				// Final safety net: a failed load never surfaces as an unhandled
				// rejection or leaves the component stuck on the skeleton.
				if ( ! cancelled ) {
					setTasks( [] );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ pendingTailor ] );

	useEffect( () => {
		if ( ! tasks || expandedId !== null ) {
			return;
		}
		const index = firstIncompleteIndex( tasks );
		const first = index === -1 ? undefined : tasks[ index ];
		if ( first ) {
			setExpandedId( first.id );
		}
	}, [ tasks, expandedId ] );

	const visibleTasks = useMemo(
		() =>
			( tasks ?? [] ).map( task =>
				skippedIds.has( task.id ) ? { ...task, completed: true } : task
			),
		[ tasks, skippedIds ]
	);

	if ( ! tasks ) {
		return <TailoredListSkeleton />;
	}

	const handleGetStarted = async ( task: EnrichedTask ) => {
		setBusyId( task.id );
		try {
			const url = await resolveCtaUrl( task, output, {
				trackTaskClicked,
				createFirstPostDraft,
				createPatternPage,
			} );
			if ( url ) {
				navigate( url );
			}
		} catch {
			// Swallow: the finally clears busy so a thrown CTA (e.g. a failed
			// pattern fetch) can't leave the card permanently disabled.
		} finally {
			setBusyId( null );
		}
	};

	const handleSkip = ( task: EnrichedTask ) => {
		setSkippedIds( prev => new Set( prev ).add( task.id ) );
		if ( expandedId === task.id ) {
			const next = visibleTasks.find(
				candidate => candidate.id !== task.id && ! candidate.completed
			);
			setExpandedId( next ? next.id : null );
		}
	};

	return (
		<div className="ai-launchpad-tailored-list">
			{ visibleTasks.map( task => (
				<TaskCard
					key={ task.id }
					task={ task }
					isExpanded={ expandedId === task.id }
					isBusy={ busyId === task.id }
					onToggle={ () => setExpandedId( expandedId === task.id ? null : task.id ) }
					onGetStarted={ () => handleGetStarted( task ) }
					onSkip={ () => handleSkip( task ) }
				/>
			) ) }
		</div>
	);
}
