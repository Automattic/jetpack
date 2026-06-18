import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { createFirstPostDraft } from '../lib/first-post.ts';
import { createPatternPage } from '../lib/pattern-page.ts';
import { trackTaskClicked } from '../lib/tracks.ts';
import {
	firstIncompleteIndex,
	isTaskActionable,
	resolveCtaUrl,
	tasksFromFixture,
	type EnrichedTask,
	type LaunchpadData,
} from './model.ts';
import { TailoredListSkeleton } from './skeleton.tsx';
import { TaskCard } from './task-card.tsx';
import type { TailoredOutput, TailorResult } from '../lib/types.ts';

import './style.scss';

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

	// Returning users: the host already fetched the composite read to decide the
	// view, so it hands the data down here to avoid fetching the same expensive
	// endpoint a second time. Omitted on the wizard→list path.
	initialData?: LaunchpadData;
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
 * @param props.initialData   - Composite read supplied by the host (returning users).
 * @return The tailored-list element.
 */
export function TailoredList( { pendingTailor, initialData }: Props = {} ) {
	const [ tasks, setTasks ] = useState< EnrichedTask[] | null >( null );
	const [ output, setOutput ] = useState< TailoredOutput | null >( null );
	const [ expandedId, setExpandedId ] = useState< string | null >( null );
	const [ skippedIds, setSkippedIds ] = useState< Set< string > >( () => new Set() );
	const [ busyId, setBusyId ] = useState< string | null >( null );

	useEffect( () => {
		// Returning users: render from the data the host already fetched, so the
		// expensive composite read isn't run a second time.
		if ( initialData ) {
			setTasks( initialData.tasks );
			setOutput( initialData.ai_output?.payload ?? null );
			return;
		}

		let cancelled = false;
		( async () => {
			// When arriving from the wizard, wait for the tailor call to settle so
			// the PUT /tailored has persisted before we read it back. A rejected
			// tailor still gives us its in-memory output as a local fallback.
			const result = await Promise.resolve( pendingTailor ).catch( () => undefined );

			let data: LaunchpadData | null = null;
			try {
				data = await apiFetch< LaunchpadData >( { path: '/wpcom/v2/ai-launchpad' } );
			} catch {
				// Read failed; fall back to the in-memory result below.
			}
			if ( cancelled ) {
				return;
			}

			if ( data && data.tasks.length > 0 ) {
				setTasks( data.tasks );
				setOutput( data.ai_output?.payload ?? null );
			} else if ( result?.output ) {
				// Read returned nothing (e.g. the fallback PUT failed): render the
				// in-memory result so the user still gets the deterministic list.
				setOutput( result.output );
				setTasks( tasksFromFixture( result.output ) );
			} else {
				setTasks( [] );
			}
		} )();
		return () => {
			cancelled = true;
		};
	}, [ pendingTailor, initialData ] );

	const visibleTasks = useMemo(
		() =>
			( tasks ?? [] ).map( task =>
				skippedIds.has( task.id ) ? { ...task, completed: true } : task
			),
		[ tasks, skippedIds ]
	);

	useEffect( () => {
		if ( ! tasks || expandedId !== null ) {
			return;
		}
		// Scan visibleTasks (skipped→completed) so skipping the last actionable
		// task doesn't re-select it and bounce the just-dismissed card open.
		const index = firstIncompleteIndex( visibleTasks );
		const first = index === -1 ? undefined : visibleTasks[ index ];
		if ( first ) {
			setExpandedId( first.id );
		}
	}, [ tasks, visibleTasks, expandedId ] );

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
					canStart={ isTaskActionable( task, output ) }
					onToggle={ () => setExpandedId( expandedId === task.id ? null : task.id ) }
					onGetStarted={ () => handleGetStarted( task ) }
					onSkip={ () => handleSkip( task ) }
				/>
			) ) }
		</div>
	);
}
