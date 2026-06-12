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
import type { TailoredOutput } from '../lib/types.ts';

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
 * @return The tailored-list element.
 */
export function TailoredList() {
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

		apiFetch< LaunchpadData >( { path: '/wpcom/v2/ai-launchpad' } ).then( data => {
			setTasks( data.tasks );
			setOutput( data.ai_output?.payload ?? null );
		} );
	}, [] );

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
		const url = await resolveCtaUrl( task, output, {
			trackTaskClicked,
			createFirstPostDraft,
			createPatternPage,
		} );
		if ( url ) {
			navigate( url );
			return;
		}
		setBusyId( null );
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
