import jetpackAnalytics from '@automattic/jetpack-analytics';
import { ExternalLink, Notice } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getConnectUrl, isSiteConnected } from '../../../connection';
import { usePodcastSettings } from '../../../hooks/use-podcast-settings';
import { DirectoryRow } from '../../directory-list';
import './style.scss';
import { extractRejectionReasons, usePocketCastsSubmit } from './use-submit';
import type { PodcastShowState } from '../../../types';
import type { PodcastAppRowProps } from '../types';

const SUBMIT_LABEL = __( 'Submit', 'jetpack-podcast' );
const NOT_CONNECTED_LABEL = __( 'Connect this site to WordPress.com first', 'jetpack-podcast' );
const SENT_MESSAGE = __( 'Your podcast was sent to Pocket Casts.', 'jetpack-podcast' );

const liveStateFromResult = ( state: string ): PodcastShowState | null =>
	state === 'active' || state === 'pending' ? state : null;

const PocketCastsRow = ( { app, state, blockedReason, onFirstSave }: PodcastAppRowProps ) => {
	const { data: settings } = usePodcastSettings();

	const isFirstEverActivity = useMemo( () => {
		if ( ! settings ) {
			return false;
		}
		const anyUrl = Object.values( settings.podcasting_show_urls ).some(
			( url ): url is string => !! url
		);
		const anyState = Object.values( settings.podcasting_show_states ).some( s => !! s );
		return ! anyUrl && ! anyState;
	}, [ settings ] );

	const { submit, isSubmitting, result, errorMessage } = usePocketCastsSubmit();
	const celebratedRef = useRef( false );

	const connected = isSiteConnected();
	const reason = connected ? blockedReason : NOT_CONNECTED_LABEL;

	const liveState = result ? liveStateFromResult( result.state ) : null;
	const effectiveState = liveState ?? state;
	const viewUrl = settings?.podcasting_show_urls?.pocketcasts ?? '';

	const rejectionReasons = useMemo(
		() => ( result?.state === 'rejected' ? extractRejectionReasons( result.pcc ) : [] ),
		[ result ]
	);
	const rejectedMessage = result?.state === 'rejected' ? result.message : null;

	useEffect( () => {
		if ( celebratedRef.current || ! isFirstEverActivity || ! result ) {
			return;
		}
		if ( result.state === 'active' || result.state === 'pending' ) {
			celebratedRef.current = true;
			onFirstSave?.();
		}
	}, [ isFirstEverActivity, result, onFirstSave ] );

	const handleSubmit = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_podcast_submit_clicked', {
			directory: app.id,
			prior_state: state || 'none',
		} );
		submit();
	}, [ submit, state, app.id ] );

	return (
		<DirectoryRow
			app={ app }
			state={ effectiveState }
			blockedReason={ reason }
			actionLabel={ SUBMIT_LABEL }
			blockedActionLabel={
				reason
					? sprintf(
							/* translators: 1: directory name (Pocket Casts). 2: reason the Submit button is disabled. */
							__( 'Submit to %1$s. %2$s', 'jetpack-podcast' ),
							app.name,
							reason
					  )
					: ''
			}
			isBusy={ isSubmitting }
			// A stored `active` can come from Feed_Detection promoting a crawler
			// hit, which never records a share link. Only this session's verdict
			// closes the row out, so that case stays re-submittable to fetch one.
			isComplete={ result?.state === 'active' }
			viewUrl={ viewUrl }
			focusViewLink={ !! result }
			onAction={ handleSubmit }
		>
			{ ! connected && ! viewUrl && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'Connect this site to WordPress.com to submit your podcast to Pocket Casts.',
						'jetpack-podcast'
					) }{ ' ' }
					<ExternalLink href={ getConnectUrl() }>
						{ __( 'Connect Jetpack', 'jetpack-podcast' ) }
					</ExternalLink>
				</Notice>
			) }

			{ ( result?.state === 'active' || result?.state === 'pending' ) && (
				<Notice status={ result.state === 'active' ? 'success' : 'info' } isDismissible={ false }>
					{ result.message || SENT_MESSAGE }
				</Notice>
			) }

			{ result?.state === 'rejected' && (
				<Notice status="error" isDismissible={ false }>
					{ rejectedMessage ?? __( 'Pocket Casts could not accept this feed.', 'jetpack-podcast' ) }
					{ rejectionReasons.length > 0 && (
						<ul className="podcast__pocketcasts-errors">
							{ rejectionReasons.map( ( rejection, i ) => (
								<li key={ `${ i }-${ rejection }` }>{ rejection }</li>
							) ) }
						</ul>
					) }
				</Notice>
			) }

			{ errorMessage && (
				<Notice status="error" isDismissible={ false }>
					{ errorMessage }
				</Notice>
			) }
		</DirectoryRow>
	);
};

export default PocketCastsRow;
