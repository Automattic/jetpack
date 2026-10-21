import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
import { useTracks } from '../../wpcom-hosting-feature-page/js/tracks.ts';
import {
	findResumableDownload,
	hasSelectedItems,
	pickLastBackup,
	readCreatedDownload,
	readDownload,
} from './download.ts';
import type { Download, DownloadItems, LastBackup } from './download.ts';

// wpcom's apiFetch middleware sends `wpcom/*` paths to the WordPress.com API, adding the site.
const BACKUPS_PATH = '/wpcom/v3/rewind/backups?number=10';
const DOWNLOADS_PATH = '/wpcom/v2/rewind/downloads';

// A minute of quick polls, then slower ones for a large site's long build.
const POLL_INTERVAL_MS = 2000;
const SLOW_POLL_INTERVAL_MS = 10_000;
const FAST_POLLS = 30;
const MAX_POLL_FAILURES = 5;

export type DownloadPhase =
	| { name: 'idle' }
	| { name: 'submitting' }
	| { name: 'progress'; id: number; percent: number }
	| { name: 'ready'; url: string; size: string }
	| { name: 'error'; message: string };

/**
 * A failure in a translated frame, so an untranslated upstream reason is never the whole message.
 *
 * @param reason - What WordPress.com said, if anything.
 * @return The message to show.
 */
function failureMessage( reason: string ): string {
	return reason
		? sprintf(
				/* translators: %s: the reason WordPress.com gave for the failure. */
				__( 'Download failed: %s', 'jetpack-mu-wpcom' ),
				reason
			)
		: __( 'Download failed.', 'jetpack-mu-wpcom' );
}

/**
 * What the panel shows for a download.
 *
 * @param download - The download.
 * @return The phase.
 */
function phaseOf( download: Download ): DownloadPhase {
	switch ( download.status ) {
		case 'running':
			return { name: 'progress', id: download.id, percent: download.progress };
		case 'finished':
			return { name: 'ready', url: download.url, size: download.size };
		case 'failed':
			return { name: 'error', message: failureMessage( download.error ) };
		case 'expired':
			return {
				name: 'error',
				message: __( 'This download has expired. Create a new file.', 'jetpack-mu-wpcom' ),
			};
	}
}

/**
 * Find a reverted site's last backup, and create, follow and resume a download of it.
 *
 * @return The backup (undefined while looking, null when there is none), the phase, and its actions.
 */
export function useLastBackupDownload() {
	const [ backup, setBackup ] = useState< LastBackup | null >();
	const [ phase, setPhase ] = useState< DownloadPhase >( { name: 'idle' } );
	const pollingId = phase.name === 'progress' ? phase.id : null;
	// Stable for the page's life, so listing it never restarts a poll.
	const { recordTracksEvent } = useTracks();

	useEffect( () => {
		let active = true;

		Promise.allSettled( [
			apiFetch( { path: BACKUPS_PATH } ),
			apiFetch( { path: DOWNLOADS_PATH } ),
		] ).then( ( [ backups, downloads ] ) => {
			if ( ! active ) {
				return;
			}

			// A failed lookup offers nothing, as Calypso does; a failed list only misses a download under way.
			const found = backups.status === 'fulfilled' ? pickLastBackup( backups.value ) : null;
			const resumable =
				found && downloads.status === 'fulfilled'
					? findResumableDownload( downloads.value, found.rewindId )
					: null;

			if ( resumable ) {
				setPhase( phaseOf( resumable ) );
			}
			setBackup( found );
		} );

		return () => {
			active = false;
		};
	}, [] );

	useEffect( () => {
		if ( pollingId === null ) {
			return;
		}

		let active = true;
		let timer: ReturnType< typeof setTimeout >;
		let polls = 0;
		let failures = 0;

		const schedule = () => {
			timer = setTimeout( poll, polls < FAST_POLLS ? POLL_INTERVAL_MS : SLOW_POLL_INTERVAL_MS );
		};

		const poll = async () => {
			polls++;

			let download: Download | null = null;
			try {
				download = readDownload( await apiFetch( { path: `${ DOWNLOADS_PATH }/${ pollingId }` } ) );
			} catch {
				// A failed request and a reply that names no download count alike, as one failed poll.
			}

			if ( ! active ) {
				return;
			}

			if ( ! download ) {
				failures++;
				if ( failures < MAX_POLL_FAILURES ) {
					schedule();
				} else {
					setPhase( {
						name: 'error',
						message: __(
							'We lost track of this download. Reload the page to check on it.',
							'jetpack-mu-wpcom'
						),
					} );
				}
				return;
			}

			failures = 0;
			setPhase( phaseOf( download ) );

			if ( download.status === 'running' ) {
				schedule();
			} else if ( download.status === 'finished' ) {
				recordTracksEvent( 'calypso_jetpack_backup_download_ready' );
			}
		};

		schedule();

		return () => {
			active = false;
			clearTimeout( timer );
		};
	}, [ pollingId, recordTracksEvent ] );

	const submit = useCallback(
		async ( items: DownloadItems ) => {
			if ( ! backup || ! hasSelectedItems( items ) ) {
				return;
			}

			setPhase( { name: 'submitting' } );
			recordTracksEvent( 'calypso_jetpack_backup_download_click' );

			try {
				const created = readCreatedDownload(
					await apiFetch( {
						path: DOWNLOADS_PATH,
						method: 'POST',
						data: { rewindId: backup.rewindId, types: items },
					} ),
					backup.rewindId
				);

				if ( created === 'busy' ) {
					setPhase( {
						name: 'error',
						message: __(
							'Another downloadable file is being created for this site. Try again once it finishes.',
							'jetpack-mu-wpcom'
						),
					} );
				} else {
					setPhase(
						created
							? { name: 'progress', id: created, percent: 0 }
							: { name: 'error', message: failureMessage( '' ) }
					);
				}
			} catch ( error ) {
				const reason = ( error as { message?: unknown } | null )?.message;
				setPhase( {
					name: 'error',
					message: failureMessage( typeof reason === 'string' ? reason : '' ),
				} );
			}
		},
		[ backup, recordTracksEvent ]
	);

	const reset = useCallback( () => setPhase( { name: 'idle' } ), [] );

	return { backup, phase, submit, reset };
}
