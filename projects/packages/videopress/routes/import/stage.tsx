import AdminPage from '@automattic/jetpack-components/admin-page';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate } from '@wordpress/route';
import { Button, Stack, Text } from '@wordpress/ui';
import ConnectCard from '../../src/dashboard/components/import/connect-card';
import ImportPicker from '../../src/dashboard/components/import/picker';
import ImportQueue from '../../src/dashboard/components/import/queue';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { useImportJob } from '../../src/dashboard/hooks/use-import-job';
import { useYouTubeConnection } from '../../src/dashboard/hooks/use-youtube-connection';
import { isStudioEnabled } from '../../src/dashboard/utils/studio';
import './style.scss';
import type { QueueItem } from '../../src/dashboard/components/import/queue';
import type { ImportJobItem } from '../../src/dashboard/hooks/use-import-job';
import type { YouTubeVideo } from '../../src/dashboard/hooks/use-youtube-videos';
import type { ReactNode } from 'react';

// Deep-link fallback for when the feature flag is off. The flag also strips
// this route from the server-side registry, so this only renders in edge
// cases (e.g. a stale client); mirrors routes/playlists/stage.tsx's NotFound.
const NotFound = () => (
	<AdminPage
		breadcrumbs={
			<Breadcrumbs
				items={ [
					{ label: 'VideoPress', to: '/library' },
					{ label: __( 'Not found', 'jetpack-videopress-pkg' ) },
				] }
			/>
		}
	>
		<div className="vp-import vp-import__not-found">
			<Stack direction="column" gap="md" align="center">
				<Text>{ __( "We couldn't find that page.", 'jetpack-videopress-pkg' ) }</Text>
				<Link to="/library">{ __( 'Back to Library', 'jetpack-videopress-pkg' ) }</Link>
			</Stack>
		</div>
	</AdminPage>
);

// Shared page chrome for every state of the flow, so switching between
// connect/picker/queue never blanks the breadcrumbs.
const PageShell = ( { children }: { children: ReactNode } ) => (
	<AdminPage
		breadcrumbs={
			<Breadcrumbs
				items={ [
					{ label: __( 'Library', 'jetpack-videopress-pkg' ), to: '/library' },
					{ label: __( 'Import from YouTube', 'jetpack-videopress-pkg' ) },
				] }
			/>
		}
	>
		<div className="vp-import">{ children }</div>
	</AdminPage>
);

const StageInner = () => {
	// True while the OAuth connect popup is open; drives the connection
	// query's 2s polling so the UI flips to the picker when the flow lands.
	const [ isPopupOpen, setPopupOpen ] = useState( false );
	const { connection, isLoading, isError, refetch } = useYouTubeConnection( {
		polling: isPopupOpen,
	} );
	const { startImport, isStarting, startError, job, isImporting } = useImportJob();

	// The batch being imported, in selection order, with titles captured at
	// import time (the queue renders after the picker unmounts, so the
	// listing may no longer be around to resolve ids to titles).
	const [ queued, setQueued ] = useState< { id: string; title: string }[] >( [] );
	// Per-video results merged across every job this flow started: a retry
	// spawns a new job containing only the retried item, so results from
	// earlier jobs must survive it.
	const [ results, setResults ] = useState< Record< string, ImportJobItem > >( {} );

	useEffect( () => {
		const items = job?.items;
		if ( ! items?.length ) {
			return;
		}
		setResults( prev => {
			let changed = false;
			const next = { ...prev };
			for ( const item of items ) {
				const existing = prev[ item.externalId ];
				if (
					! existing ||
					existing.status !== item.status ||
					existing.attachmentId !== item.attachmentId ||
					existing.error?.message !== item.error?.message
				) {
					next[ item.externalId ] = item;
					changed = true;
				}
			}
			// Returning prev verbatim lets React bail out of the re-render,
			// which also keeps this effect from looping on identity churn.
			return changed ? next : prev;
		} );
	}, [ job ] );

	const handleImport = useCallback(
		( videos: YouTubeVideo[] ) => {
			if ( videos.length === 0 ) {
				return;
			}
			setQueued( videos.map( video => ( { id: video.externalId, title: video.title } ) ) );
			setResults( {} );
			// A rejected POST surfaces via startError (rendered as per-item
			// failures below); swallow the rejection so it isn't unhandled.
			startImport( videos.map( video => video.externalId ) ).catch( () => {} );
		},
		[ startImport ]
	);

	const handleRetry = useCallback(
		( externalId: string ) => {
			// Drop the stale failure so the row falls back to "queued" while
			// the new single-item job runs (or to "failed" again if the POST
			// itself rejects and startError kicks in).
			setResults( prev => {
				const next = { ...prev };
				delete next[ externalId ];
				return next;
			} );
			startImport( [ externalId ] ).catch( () => {} );
		},
		[ startImport ]
	);

	const navigate = useNavigate();
	const goToLibrary = useCallback( () => navigate( { href: '/library' } ), [ navigate ] );

	// The queue takes precedence over the connection states: once an import
	// is under way, a connection hiccup shouldn't yank the progress list.
	if ( queued.length > 0 ) {
		const queueItems: QueueItem[] = queued.map( ( { id, title } ) => {
			const result = results[ id ];
			if ( result ) {
				return { externalId: id, title, status: result.status, error: result.error };
			}
			if ( startError && ! isStarting ) {
				// The POST itself failed: nothing was queued server-side, so
				// every item without a result is failed with that error.
				return {
					externalId: id,
					title,
					status: 'failed',
					error: { code: 'import_request_failed', message: startError.message },
				};
			}
			return { externalId: id, title, status: 'queued', error: null };
		} );

		return (
			<ImportQueue
				items={ queueItems }
				isImporting={ isImporting || isStarting }
				onRetry={ handleRetry }
				onBack={ goToLibrary }
			/>
		);
	}

	if ( isLoading ) {
		return (
			<Stack direction="column" gap="md" align="center" className="vp-import__state">
				<Spinner />
				<Text>{ __( 'Checking your YouTube connection…', 'jetpack-videopress-pkg' ) }</Text>
			</Stack>
		);
	}

	if ( isError ) {
		return (
			<Stack direction="column" gap="md" align="center" className="vp-import__state">
				<Text>
					{ __( "We couldn't check your YouTube connection.", 'jetpack-videopress-pkg' ) }
				</Text>
				<Button variant="outline" onClick={ () => refetch() }>
					{ __( 'Try again', 'jetpack-videopress-pkg' ) }
				</Button>
			</Stack>
		);
	}

	if ( ! connection?.connected ) {
		return (
			<ConnectCard
				connectUrl={ connection?.connectUrl ?? null }
				onPollingChange={ setPopupOpen }
				refetch={ refetch }
			/>
		);
	}

	return (
		<ImportPicker
			accountName={ connection.accountName }
			onImport={ handleImport }
			isStarting={ isStarting }
		/>
	);
};

const Stage = () => {
	if ( ! isStudioEnabled() ) {
		return <NotFound />;
	}

	return (
		<QueryClientWrapper>
			<PageShell>
				<StageInner />
			</PageShell>
		</QueryClientWrapper>
	);
};

export { Stage as stage };
