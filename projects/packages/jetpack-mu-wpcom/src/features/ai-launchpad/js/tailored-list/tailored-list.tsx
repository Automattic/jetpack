import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { createFirstPostDraft } from '../lib/first-post.ts';
import { createPatternPage } from '../lib/pattern-page.ts';
import { trackTaskClicked } from '../lib/tracks.ts';
import { Layout } from './layout.tsx';
import {
	firstIncompleteIndex,
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

	// Site context (URL + title) for the preview card. The host always has this
	// from its initial composite read, so it's passed on the wizard→list path too
	// — that lets the loading skeleton show the preview before the tailored read
	// lands. The fetched/initialData site (when present) takes precedence.
	site?: SiteData;
}

/**
 * The tailored launchpad list: task cards rendered from the AI output inside a
 * centered layout with a heading, "X of N completed" progress, and a site
 * preview. The first incomplete task auto-expands; each task offers an
 * action-specific CTA and "Skip". While the AI output is loading, the same
 * layout is shown with a shimmering skeleton and "Tailoring your checklist…".
 *
 * Titles, completion state, and deeplink paths come from Stream B's
 * `GET /ai-launchpad/`; subtitles come from the AI. In dev mode the list
 * renders from a committed fixture so it can be worked on before the AI call
 * exists.
 *
 * @param props               - Component props.
 * @param props.pendingTailor - In-flight tailor call to await before fetching.
 * @param props.initialData   - Composite read supplied by the host (returning users).
 * @param props.site          - Site context for the preview (always supplied by the host).
 * @return The tailored-list element.
 */
export function TailoredList( { pendingTailor, initialData, site }: Props = {} ) {
	// Returning users arrive with the composite read already done, so seed straight
	// from it — otherwise the first frame shows the "Tailoring…" loading copy before
	// the effect runs. The wizard→list path has no initialData and starts as loading.
	const [ tasks, setTasks ] = useState< EnrichedTask[] | null >( () => initialData?.tasks ?? null );
	const [ output, setOutput ] = useState< TailoredOutput | null >(
		() => initialData?.ai_output?.payload ?? null
	);
	const [ skippedIds, setSkippedIds ] = useState< Set< string > >( () => new Set() );
	const [ busyId, setBusyId ] = useState< string | null >( null );
	// The site's front-end URL, used to build the launch CTA and the preview
	// thumbnail; the title labels the preview. Seeded from the read (returning users)
	// or the host's `site` prop (wizard path, so the skeleton shows the preview),
	// then overridden once the read lands.
	const [ siteUrl, setSiteUrl ] = useState< string | null >(
		() => initialData?.site?.url ?? site?.url ?? null
	);
	const [ siteTitle, setSiteTitle ] = useState< string | null >(
		() => initialData?.site?.title ?? site?.title ?? null
	);

	useEffect( () => {
		// Returning users: render from the data the host already fetched, so the
		// expensive composite read isn't run a second time.
		if ( initialData ) {
			setTasks( initialData.tasks );
			setOutput( initialData.ai_output?.payload ?? null );
			if ( initialData.site ) {
				setSiteUrl( initialData.site.url ?? null );
				setSiteTitle( initialData.site.title ?? null );
			}
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

			if ( data?.site ) {
				setSiteUrl( data.site.url ?? null );
				setSiteTitle( data.site.title ?? null );
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

	if ( ! tasks ) {
		return (
			<Layout
				progressLabel={ __( 'Tailoring your checklist…', 'jetpack-mu-wpcom' ) }
				siteUrl={ siteUrl }
				siteTitle={ siteTitle }
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
			// Acknowledgment tasks have no completion signal in wp-admin (they
			// complete only in Calypso), so clicking the CTA is the completion.
			// Persist it before navigating away (same-tab nav unloads the page,
			// cancelling an un-awaited request), best-effort so a failed write never
			// blocks the navigation.
			if ( isCompleteOnClickTask( task.id ) ) {
				await apiFetch( {
					path: '/wpcom/v2/ai-launchpad/complete-task',
					method: 'POST',
					data: { task_id: task.id },
				} ).catch( () => {} );
			}
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

	// Complete-on-click tasks with no CTA destination (e.g. share_site) can't be
	// "started", so the card offers "Mark as complete": persist the completion and
	// flip the card to done in place (no navigation). Only flips on a successful
	// write so a failed POST doesn't show a completion that reverts on reload.
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
		} catch {
			// Leave the task incomplete on failure.
		} finally {
			setBusyId( null );
		}
	};

	const handleSkip = ( task: EnrichedTask ) => {
		setSkippedIds( prev => new Set( prev ).add( task.id ) );
	};

	// The first incomplete task opens on mount; because the cards are uncontrolled
	// (defaultOpen), the user can then collapse it — or all of them — without it
	// reopening. Computed from the initial render (skippedIds is empty then).
	const firstOpenIndex = firstIncompleteIndex( visibleTasks );

	return (
		<Layout progressLabel={ progressLabel } siteUrl={ siteUrl } siteTitle={ siteTitle }>
			<div className="ai-launchpad-tailored-list">
				{ visibleTasks.map( ( task, index ) => (
					<TaskCard
						key={ task.id }
						task={ task }
						isBusy={ busyId === task.id }
						canStart={ isTaskActionable( task, output, siteUrl ) }
						canMarkComplete={
							isCompleteOnClickTask( task.id ) && ! isTaskActionable( task, output, siteUrl )
						}
						defaultOpen={ index === firstOpenIndex }
						onGetStarted={ () => handleGetStarted( task ) }
						onMarkComplete={ () => handleMarkComplete( task ) }
						onSkip={ () => handleSkip( task ) }
					/>
				) ) }
			</div>
		</Layout>
	);
}
