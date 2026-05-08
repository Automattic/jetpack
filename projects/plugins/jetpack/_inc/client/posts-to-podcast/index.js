/**
 * Jetpack Posts to Podcast admin page entry.
 *
 * Calls the wpcom-side endpoint at public-api.wordpress.com directly via
 * wpcom-proxy-request — wpcom does the work, including creating the draft post
 * and returning its editUrl. On success we just navigate to that URL.
 */

import wpcomRequest from 'wpcom-proxy-request';

( function () {
	const settings = window.jetpackPostsToPodcast;
	if ( ! settings || ! settings.blogId ) {
		return;
	}

	const $ = id => document.getElementById( id );
	const i18n = settings.i18n || {};
	const sitePath = `/sites/${ settings.blogId }/posts-to-podcast`;

	/**
	 * Update the status region with the given HTML.
	 *
	 * @param {string} html - HTML fragment to render in the live status region.
	 */
	function setStatus( html ) {
		const el = $( 'jp-p2p-status' );
		if ( el ) {
			el.innerHTML = html;
		}
	}

	/**
	 * Toggle the form's busy state.
	 *
	 * @param {boolean} busy - True while a generation request is in flight.
	 */
	function setBusy( busy ) {
		const btn = $( 'jp-p2p-generate' );
		if ( btn ) {
			btn.disabled = !! busy;
			btn.textContent = busy ? i18n.generating : i18n.generate;
		}
		[ 'jp-p2p-window', 'jp-p2p-length', 'jp-p2p-voice' ].forEach( id => {
			const el = $( id );
			if ( el ) {
				el.disabled = !! busy;
			}
		} );
	}

	/**
	 * Resolve the selected window preset to the wpcom endpoint's `{ unit, n }` shape.
	 *
	 * @return {?{unit: string, n: number}} Window descriptor, or null when no preset matches.
	 */
	function buildWindow() {
		const presetId = $( 'jp-p2p-window' ).value;
		const preset = ( settings.windowPresets || [] ).find( p => p.id === presetId );
		return preset ? { unit: preset.unit, n: preset.n } : null;
	}

	/**
	 * Pull a human-readable message out of an error returned by wpcom-proxy-request
	 * or the wpcom endpoint.
	 *
	 * @param {*} err - Error string, Error object, or wpcom error envelope.
	 * @return {string} Best available message; empty string when nothing useful is present.
	 */
	function describeError( err ) {
		if ( ! err ) {
			return '';
		}
		if ( typeof err === 'string' ) {
			return err;
		}
		return err.message || err.code || '';
	}

	/**
	 * Poll the wpcom job-status endpoint until the job reaches a terminal state.
	 *
	 * @param {number} jobId     - Job id returned by the enqueue request.
	 * @param {number} startedAt - Date.now() at the start of polling, for the timeout budget.
	 */
	function pollJob( jobId, startedAt ) {
		const elapsed = Date.now() - startedAt;
		if ( elapsed > settings.pollTimeoutMs ) {
			setStatus( '<p>' + i18n.pollFailed + '</p>' );
			setBusy( false );
			return;
		}
		const nextDelay = elapsed < settings.pollSwitchMs ? settings.pollFastMs : settings.pollSlowMs;

		wpcomRequest( {
			path: `${ sitePath }/jobs/${ encodeURIComponent( jobId ) }`,
			method: 'GET',
			apiNamespace: 'wpcom/v2',
		} )
			.then( record => {
				if ( record.status === 'pending' || record.status === 'unknown' ) {
					setStatus( '<p>' + i18n.pendingStatus + '</p>' );
					setTimeout( () => pollJob( jobId, startedAt ), nextDelay );
					return;
				}
				if ( record.status === 'failed' ) {
					setStatus(
						'<p>' + i18n.jobFailed.replace( '%s', describeError( record ) || 'unknown' ) + '</p>'
					);
					setBusy( false );
					return;
				}
				if ( record.status === 'complete' ) {
					if ( record.editUrl ) {
						setStatus( '<p>' + i18n.draftCreated + '</p>' );
						window.location.href = record.editUrl;
						return;
					}
					if ( record.postId ) {
						setStatus( '<p>' + i18n.draftCreated + '</p>' );
						window.location.href =
							settings.editPostUrl + '?action=edit&post=' + encodeURIComponent( record.postId );
						return;
					}
					setStatus( '<p>' + i18n.draftCreateFailed + '</p>' );
					setBusy( false );
					return;
				}
				setStatus( '<p>' + i18n.pollFailed + '</p>' );
				setBusy( false );
			} )
			.catch( err => {
				setStatus( '<p>' + i18n.pollFailed + ' ' + describeError( err ) + '</p>' );
				setBusy( false );
			} );
	}

	/**
	 * Click handler for the Generate button: enqueue a job and start polling.
	 */
	function onGenerate() {
		setBusy( true );
		setStatus( '' );

		const win = buildWindow();
		if ( ! win ) {
			setStatus( '<p>' + i18n.queueFailed + '</p>' );
			setBusy( false );
			return;
		}

		wpcomRequest( {
			path: sitePath,
			method: 'POST',
			apiNamespace: 'wpcom/v2',
			body: {
				window: win,
				length: $( 'jp-p2p-length' ).value,
				voicePreset: $( 'jp-p2p-voice' ).value,
			},
		} )
			.then( resp => {
				if ( ! resp || ! resp.jobId ) {
					setStatus( '<p>' + i18n.queueFailed + '</p>' );
					setBusy( false );
					return;
				}
				setStatus( '<p>' + i18n.pendingStatus + '</p>' );
				pollJob( resp.jobId, Date.now() );
			} )
			.catch( err => {
				setStatus( '<p>' + i18n.queueFailed + ' ' + describeError( err ) + '</p>' );
				setBusy( false );
			} );
	}

	document.addEventListener( 'DOMContentLoaded', () => {
		const btn = $( 'jp-p2p-generate' );
		if ( btn ) {
			btn.addEventListener( 'click', onGenerate );
		}
	} );
} )();
