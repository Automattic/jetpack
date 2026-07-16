import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { createFirstPostDraft } from '../lib/first-post.ts';
import { createPatternPage } from '../lib/pattern-page.ts';
import { trackTaskClicked, trackTaskSkipped } from '../lib/tracks.ts';
import { Layout } from './layout.tsx';
import {
	nextIncompleteId,
	isCompleteOnClickTask,
	isTaskActionable,
	resolveCtaUrl,
	tasksFromFixture,
	type EnrichedTask,
	type LaunchpadData,
	type SiteData,
} from './model.ts';
import { TailoredListSkeleton } from './skeleton.tsx';
import { TaskCard } from './task-card.tsx';
import type { GoalSlug, TailoredOutput, TailorResult } from '../lib/types.ts';

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
	// In-flight tailor promise on the wizard→list path. The list waits for it to
	// settle before reading GET /ai-launchpad, otherwise the GET races the PUT and
	// returns an empty list. Its resolved result is a local fallback when the read
	// yields nothing. Omitted for returning users.
	pendingTailor?: Promise< TailorResult >;

	// The composite read the host already fetched, to avoid refetching the same
	// endpoint. Omitted on the wizard→list path.
	initialData?: LaunchpadData;

	// Site context for the preview card, passed on the wizard→list path too so the
	// skeleton can show the preview. The fetched site takes precedence.
	site?: SiteData;

	// The wizard goal, used for the heading until the AI output supplies its own.
	goal?: GoalSlug;
}

/**
 * The tailored launchpad list: task cards rendered from the AI output inside a
 * layout with a heading, "X of N completed" progress, and a site preview. The
 * first incomplete task auto-expands; each task offers an action-specific CTA and
 * "Skip". While loading, a skeleton is shown in the same layout.
 *
 * @param props               - Component props.
 * @param props.pendingTailor - In-flight tailor call to await before fetching.
 * @param props.initialData   - Composite read supplied by the host (returning users).
 * @param props.site          - Site context for the preview (always supplied by the host).
 * @param props.goal          - The wizard goal (wizard→list path), for the heading.
 * @return The tailored-list element.
 */
export function TailoredList( { pendingTailor, initialData, site, goal }: Props = {} ) {
	// Returning users seed straight from initialData so the first frame isn't the
	// loading copy. The wizard→list path has no initialData and starts as loading.
	const [ tasks, setTasks ] = useState< EnrichedTask[] | null >( () => initialData?.tasks ?? null );
	const [ output, setOutput ] = useState< TailoredOutput | null >(
		() => initialData?.ai_output?.payload ?? null
	);
	const [ skippedIds, setSkippedIds ] = useState< Set< string > >( () => new Set() );
	const [ busyId, setBusyId ] = useState< string | null >( null );
	// The single expanded card (accordion: only one open at a time). `null` means
	// every card is collapsed — a state the user can reach by toggling the open card
	// shut, which must not auto-reopen.
	const [ openId, setOpenId ] = useState< string | null >( () =>
		initialData?.tasks ? nextIncompleteId( initialData.tasks ) : null
	);
	// Guards the one-time auto-open so the load effect doesn't fight a user who has
	// collapsed every card.
	const didAutoOpen = useRef( !! initialData?.tasks );
	// Seeded from the read (returning users) or the host's `site` prop (wizard path),
	// then overridden once the read lands.
	const [ siteUrl, setSiteUrl ] = useState< string | null >(
		() => initialData?.site?.url ?? site?.url ?? null
	);
	const [ siteTitle, setSiteTitle ] = useState< string | null >(
		() => initialData?.site?.title ?? site?.title ?? null
	);
	// The Site Editor URL: the preview thumbnail's quick link; null on classic themes.
	const [ siteEditUrl, setSiteEditUrl ] = useState< string | null >(
		() => initialData?.site?.edit_url ?? site?.edit_url ?? null
	);

	useEffect( () => {
		// Returning users: render from the data the host already fetched.
		if ( initialData ) {
			setTasks( initialData.tasks );
			setOutput( initialData.ai_output?.payload ?? null );
			if ( initialData.site ) {
				setSiteUrl( initialData.site.url ?? null );
				setSiteTitle( initialData.site.title ?? null );
				setSiteEditUrl( initialData.site.edit_url ?? null );
			}
			return;
		}

		let cancelled = false;
		( async () => {
			// Wait for the tailor call to settle so the PUT has persisted before we
			// read it back. A rejected tailor still gives its in-memory output as a fallback.
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

			if ( data?.site ) {
				setSiteUrl( data.site.url ?? null );
				setSiteTitle( data.site.title ?? null );
				setSiteEditUrl( data.site.edit_url ?? null );
			}

			if ( data && data.tasks.length > 0 ) {
				setTasks( data.tasks );
				setOutput( data.ai_output?.payload ?? null );
			} else if ( result?.output ) {
				// Read returned nothing: render the in-memory result instead.
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

	// Open the first incomplete card once the tasks first arrive on the wizard→list
	// path. Guarded so it runs only once and never reopens a collapsed list.
	useEffect( () => {
		if ( ! didAutoOpen.current && tasks && tasks.length > 0 ) {
			setOpenId( nextIncompleteId( tasks ) );
			didAutoOpen.current = true;
		}
	}, [ tasks ] );

	const visibleTasks = useMemo(
		() =>
			( tasks ?? [] ).map( task =>
				skippedIds.has( task.id ) ? { ...task, completed: true } : task
			),
		[ tasks, skippedIds ]
	);

	// Prefer the goal from the loaded AI output; fall back to the wizard's.
	const effectiveGoal = output?.inferred?.goal ?? goal ?? null;

	if ( ! tasks ) {
		return (
			<Layout
				progressLabel={ __( 'Tailoring your checklist…', 'jetpack-mu-wpcom' ) }
				goal={ effectiveGoal }
				siteUrl={ siteUrl }
				siteTitle={ siteTitle }
				siteEditUrl={ siteEditUrl }
			>
				<TailoredListSkeleton />
			</Layout>
		);
	}

	const completedCount = visibleTasks.filter( task => task.completed ).length;
	const progressLabel = sprintf(
		/* translators: 1: number of completed tasks, 2: total number of tasks. */
		__( '%1$d of %2$d completed', 'jetpack-mu-wpcom' ),
		completedCount,
		visibleTasks.length
	);

	const handleGetStarted = async ( task: EnrichedTask ) => {
		setBusyId( task.id );
		try {
			const url = await resolveCtaUrl(
				task,
				output,
				{
					trackTaskClicked,
					createFirstPostDraft,
					createPatternPage,
				},
				siteUrl
			);
			// These tasks have no completion signal in wp-admin, so clicking the CTA
			// is the completion. Persist it before navigating (same-tab nav cancels an
			// un-awaited request); best-effort so a failed write never blocks navigation.
			if ( isCompleteOnClickTask( task.id ) ) {
				await apiFetch( {
					path: '/wpcom/v2/ai-launchpad/complete-task',
					method: 'POST',
					data: { task_id: task.id },
				} ).catch( () => {} );
			}
			if ( url ) {
				// Keep the button busy through the page unload; clearing it here would flash
				// the label back before the browser navigates, making the flow look stalled.
				navigate( url );
				return;
			}
		} catch {
			// Fall through to clear busy so a thrown CTA can't leave the card disabled.
		}
		setBusyId( null );
	};

	// Complete-on-click tasks with no CTA destination offer "Mark as complete":
	// persist the completion and flip the card to done in place. Only flips on a
	// successful write so a failed POST doesn't show a completion that reverts on reload.
	const handleMarkComplete = async ( task: EnrichedTask ) => {
		setBusyId( task.id );
		try {
			trackTaskClicked( { task_id: task.id } );
			await apiFetch( {
				path: '/wpcom/v2/ai-launchpad/complete-task',
				method: 'POST',
				data: { task_id: task.id },
			} );
			setTasks( prev =>
				prev ? prev.map( t => ( t.id === task.id ? { ...t, completed: true } : t ) ) : prev
			);
			// Advance the accordion to the next task, mirroring Skip — otherwise the
			// just-completed (now non-collapsible) card keeps openId and the list collapses.
			const afterComplete = ( tasks ?? [] ).map( t =>
				t.id === task.id || skippedIds.has( t.id ) ? { ...t, completed: true } : t
			);
			setOpenId( nextIncompleteId( afterComplete, task.id ) );
		} catch {
			// Leave the task incomplete on failure.
		} finally {
			setBusyId( null );
		}
	};

	// Skipping persists server-side (so it survives reloads and counts toward
	// completion), then marks the task complete and expands the next incomplete
	// task. Compute the next id from the post-skip list so it's never re-opened.
	const handleSkip = async ( task: EnrichedTask ) => {
		setBusyId( task.id );
		trackTaskSkipped( { task_id: task.id } );
		await apiFetch( {
			path: '/wpcom/v2/ai-launchpad/skip-task',
			method: 'POST',
			data: { task_id: task.id },
		} ).catch( () => {} );
		setBusyId( null );
		const nextSkipped = new Set( skippedIds ).add( task.id );
		setSkippedIds( nextSkipped );
		const afterSkip = ( tasks ?? [] ).map( t =>
			nextSkipped.has( t.id ) ? { ...t, completed: true } : t
		);
		setOpenId( nextIncompleteId( afterSkip, task.id ) );
	};

	return (
		<Layout
			progressLabel={ progressLabel }
			goal={ effectiveGoal }
			siteUrl={ siteUrl }
			siteTitle={ siteTitle }
			siteEditUrl={ siteEditUrl }
		>
			<div className="ai-launchpad-tailored-list">
				{ visibleTasks.map( task => (
					<TaskCard
						key={ task.id }
						task={ task }
						isBusy={ busyId === task.id }
						isLocked={ busyId !== null }
						canStart={ isTaskActionable( task, output, siteUrl ) }
						canMarkComplete={
							isCompleteOnClickTask( task.id ) && ! isTaskActionable( task, output, siteUrl )
						}
						isOpen={ openId === task.id }
						onOpenChange={ open => setOpenId( open ? task.id : null ) }
						onGetStarted={ () => handleGetStarted( task ) }
						onMarkComplete={ () => handleMarkComplete( task ) }
						onSkip={ () => handleSkip( task ) }
					/>
				) ) }
			</div>
		</Layout>
	);
}
