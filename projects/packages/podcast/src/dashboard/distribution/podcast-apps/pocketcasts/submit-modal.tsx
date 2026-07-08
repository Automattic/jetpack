// Pocket Casts ships its own submit endpoint
// (`/wpcom/v2/podcast-distribution/pocket-casts/submit`, proxied to wpcom), so
// this app replaces the default 3-step modal with a single-click flow whose
// button reflects the last-known state and the relay's verdict on submit.

import jetpackAnalytics from '@automattic/jetpack-analytics';
import {
	Button,
	ExternalLink,
	Modal,
	Notice,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { getConnectUrl, isSiteConnected } from '../../../connection';
import { usePodcastSettings } from '../../../hooks/use-podcast-settings';
import './style.scss';
import { extractRejectionReasons, usePocketCastsSubmit } from './use-submit';
import type { PodcastShowState } from '../../../types';
import type { PodcastAppModalProps } from '../types';

const stateLabel = ( state: PodcastShowState ): string => {
	switch ( state ) {
		case 'active':
			return __( 'Submitted', 'jetpack-podcast' );
		case 'pending':
			return __( 'Pending', 'jetpack-podcast' );
		default:
			return __( 'Submit to Pocket Casts', 'jetpack-podcast' );
	}
};

// `rejected`/`unreachable` aren't a persisted button state — they trip a
// notice instead and leave the button label whatever was last saved.
const liveStateFromResult = ( state: string ): PodcastShowState | null => {
	if ( state === 'active' || state === 'pending' ) {
		return state;
	}
	return null;
};

const PocketCastsSubmitModal = ( { app, feedUrl, onClose, onFirstSave }: PodcastAppModalProps ) => {
	const { data: settings } = usePodcastSettings();
	const storedState = settings?.podcasting_show_states?.pocketcasts ?? '';

	// True only if we know settings are loaded AND nothing else is saved yet —
	// matches the parent's confetti rule (first successful directory action).
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

	// Live result wins over the persisted state until the modal is reopened.
	const liveState = result ? liveStateFromResult( result.state ) : null;
	const effectiveState: PodcastShowState = liveState ?? storedState;

	const rejectionReasons = useMemo(
		() => ( result?.state === 'rejected' ? extractRejectionReasons( result.pcc ) : [] ),
		[ result ]
	);
	const rejectedMessage = result?.state === 'rejected' ? result.message : null;

	const handleSubmit = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_podcast_submit_clicked', {
			directory: app.id,
			prior_state: storedState || 'none',
		} );
		submit();
	}, [ submit, storedState, app.id ] );

	// Fire confetti once when this Pocket Casts submission is the user's first
	// distribution activity. Ref guard so `result` staying set across renders
	// doesn't re-trigger the callback.
	useEffect( () => {
		if ( celebratedRef.current || ! isFirstEverActivity || ! result ) {
			return;
		}
		if ( result.state === 'active' || result.state === 'pending' ) {
			celebratedRef.current = true;
			onFirstSave?.();
		}
	}, [ isFirstEverActivity, result, onFirstSave ] );

	const titleText = sprintf(
		/* translators: %s: podcast directory name. */
		__( 'Submit to %s', 'jetpack-podcast' ),
		app.name
	);

	const isDone = effectiveState === 'active';
	const buttonClassName = `podcast__pocketcasts-button podcast__pocketcasts-button--${
		effectiveState || 'idle'
	}`;

	return (
		<Modal title={ titleText } onRequestClose={ onClose } className="podcast__pocketcasts-modal">
			<VStack spacing={ 5 }>
				<Text as="p" variant="muted">
					{ feedUrl
						? __(
								'We’ll send your podcast feed to Pocket Casts. Most submissions go live within a few minutes.',
								'jetpack-podcast'
						  )
						: __(
								'Set your podcast category in the Settings tab to generate your RSS feed before submitting.',
								'jetpack-podcast'
						  ) }
				</Text>

				{ feedUrl && (
					<Text as="p" className="podcast__pocketcasts-feed-url" title={ feedUrl }>
						{ feedUrl }
					</Text>
				) }

				{ result?.state === 'active' && result.share_link && (
					<Text as="p" variant="muted">
						<ExternalLink href={ result.share_link }>
							{ __( 'View on Pocket Casts', 'jetpack-podcast' ) }
						</ExternalLink>
					</Text>
				) }

				{ ! connected && (
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

				{ result?.state === 'rejected' && (
					<Notice status="error" isDismissible={ false }>
						{ rejectedMessage ??
							__( 'Pocket Casts could not accept this feed.', 'jetpack-podcast' ) }
						{ rejectionReasons.length > 0 && (
							<ul className="podcast__pocketcasts-errors">
								{ rejectionReasons.map( reason => (
									<li key={ reason }>{ reason }</li>
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

				<Button
					variant="primary"
					__next40pxDefaultSize
					className={ buttonClassName }
					icon={ isDone ? check : undefined }
					iconPosition="left"
					onClick={ handleSubmit }
					isBusy={ isSubmitting }
					disabled={ ! connected || ! feedUrl || isSubmitting || isDone }
					accessibleWhenDisabled
				>
					{ isSubmitting && ! effectiveState
						? __( 'Submitting…', 'jetpack-podcast' )
						: stateLabel( effectiveState ) }
				</Button>
			</VStack>
		</Modal>
	);
};

export default PocketCastsSubmitModal;
