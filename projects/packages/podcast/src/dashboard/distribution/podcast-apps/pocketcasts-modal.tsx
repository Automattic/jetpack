// One-click submit flow for Pocket Casts. Replaces the default 3-step modal
// for this directory only — `pocketcasts.tsx` sets `Modal: PocketCastsModal`.
//
// The wpcom relay endpoint is idempotent: re-calling it for a known feed
// returns the current state. So:
//
//   - On mount, if the stored state is `pending`, refresh by re-submitting
//     (silent — no Tracks "started" event, since the user didn't click).
//   - User-clicked submits emit `jetpack_podcast_pocketcasts_submit_started`.
//   - Every response emits `jetpack_podcast_pocketcasts_submit_completed`.
//   - On `active`, sync `share_link` into `podcasting_show_urls.pocketcasts`
//     (silent save) so the public site's share buttons and the saved-URL UX
//     in other modals work without a manual paste.

import jetpackAnalytics from '@automattic/jetpack-analytics';
import {
	Button,
	ExternalLink,
	Icon,
	Modal,
	Notice,
	Spinner,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { check, link as linkIcon } from '@wordpress/icons';
import {
	useInvalidatePodcastSettings,
	usePodcastSettings,
	useUpdatePodcastSettings,
} from '../../hooks/use-podcast-settings';
import {
	usePocketCastsSubmit,
	type PocketCastsSubmitResponse,
	type PocketCastsSubmitState,
} from './use-pocket-casts-submit';
import type { PodcastAppModalProps } from './types';

// Hoisted so terser can't fold them into __(cond?'a':'b') — the i18n-check
// validator rejects that shape.
const COPIED_LABEL = __( 'Copied!', 'jetpack-podcast' );
const COPY_LINK_LABEL = __( 'Copy link', 'jetpack-podcast' );

interface ShareLinkRowProps {
	url: string;
}

const ShareLinkRow = ( { url }: ShareLinkRowProps ) => {
	const [ hasCopied, setHasCopied ] = useState( false );

	const copyRef = useCopyToClipboard< HTMLButtonElement >( url, () => setHasCopied( true ) );

	useEffect( () => {
		if ( ! hasCopied ) {
			return;
		}
		const timer = setTimeout( () => setHasCopied( false ), 2000 );
		return () => clearTimeout( timer );
	}, [ hasCopied ] );

	return (
		<HStack alignment="center" spacing={ 2 } className="podcast__pocketcasts-share-row">
			<Text className="podcast__pocketcasts-share-url" title={ url }>
				<ExternalLink href={ url }>{ url }</ExternalLink>
			</Text>
			<Button
				ref={ copyRef }
				variant="secondary"
				__next40pxDefaultSize
				icon={ linkIcon }
				iconPosition="left"
			>
				{ hasCopied ? COPIED_LABEL : COPY_LINK_LABEL }
			</Button>
		</HStack>
	);
};

const extractFeedbackErrors = ( response: PocketCastsSubmitResponse | null ): string[] => {
	const errors = response?.pcc?.feedback?.errors;
	if ( ! Array.isArray( errors ) ) {
		return [];
	}
	return errors
		.map( err => ( typeof err?.message === 'string' ? err.message.trim() : '' ) )
		.filter( ( msg ): msg is string => msg.length > 0 );
};

interface ResolvedState {
	state: PocketCastsSubmitState | 'idle';
	shareLink: string | null;
	message: string | null;
	response: PocketCastsSubmitResponse | null;
}

const PocketCastsModal = ( { app, feedUrl, onClose, onFirstSave }: PodcastAppModalProps ) => {
	const { data: settings } = usePodcastSettings();
	const { mutate: saveSettings } = useUpdatePodcastSettings();
	const invalidateSettings = useInvalidatePodcastSettings();
	const { submit, isPending, response, error, reset } = usePocketCastsSubmit();

	const storedState = settings?.podcasting_show_states?.pocketcasts;
	const storedShareLink = settings?.podcasting_show_urls?.pocketcasts ?? '';
	const allStoredUrls = settings?.podcasting_show_urls;
	// `null` until settings hydrate; suppress confetti rather than guess.
	const hadAnyStoredUrl = allStoredUrls
		? Object.values( allStoredUrls ).some( ( url ): url is string => !! url )
		: null;

	// Track whether the active state shown right now came from this modal session
	// (so we fire the confetti) or from a prior session (so we don't).
	const sessionEnteredActiveRef = useRef( false );
	// Pending → idempotent auto-refresh on mount, exactly once. Without the
	// guard React Strict-Mode re-mounts would double-fire the relay POST.
	const autoRefreshedRef = useRef( false );

	useEffect( () => {
		if ( autoRefreshedRef.current ) {
			return;
		}
		if ( ! settings ) {
			return; // Wait for settings hydration so storedState is trustworthy.
		}
		autoRefreshedRef.current = true;
		if ( storedState === 'pending' ) {
			submit();
		}
	}, [ settings, storedState, submit ] );

	// Sync `share_link` back into the show URL map when we land on `active`.
	const lastSavedShareLinkRef = useRef< string | null >( null );
	useEffect( () => {
		if ( response?.state !== 'active' ) {
			return;
		}
		const shareLink = response.share_link;
		if ( ! shareLink || shareLink === storedShareLink ) {
			return;
		}
		if ( lastSavedShareLinkRef.current === shareLink ) {
			return;
		}
		lastSavedShareLinkRef.current = shareLink;
		const isFirstEverSave = hadAnyStoredUrl === null ? false : ! hadAnyStoredUrl;
		saveSettings(
			{ podcasting_show_urls: { pocketcasts: shareLink } },
			{
				silent: true,
				onSuccess: () => {
					if ( isFirstEverSave ) {
						onFirstSave?.();
					}
				},
			}
		);
	}, [ response, storedShareLink, hadAnyStoredUrl, onFirstSave, saveSettings ] );

	// Reload the settings cache so a re-open (or a sibling tab) sees the latest
	// server-persisted `podcasting_show_states`.
	useEffect( () => {
		if ( ! response ) {
			return;
		}
		invalidateSettings();
	}, [ response, invalidateSettings ] );

	useEffect( () => {
		if ( ! response ) {
			return;
		}
		jetpackAnalytics.tracks.recordEvent( 'jetpack_podcast_pocketcasts_submit_completed', {
			state: response.state,
		} );
		if ( response.state === 'active' ) {
			sessionEnteredActiveRef.current = true;
		}
	}, [ response ] );

	const handleSubmit = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_podcast_pocketcasts_submit_started', {
			has_stored_state: !! storedState,
		} );
		submit();
	}, [ submit, storedState ] );

	const handleRetry = useCallback( () => {
		reset();
		handleSubmit();
	}, [ reset, handleSubmit ] );

	// Resolve "what should we render right now" off the response if we have
	// one, otherwise off the stored state. `idle` means we have nothing to
	// show yet and should render the initial CTA.
	const resolved: ResolvedState = ( () => {
		if ( response ) {
			return {
				state: response.state,
				shareLink: response.share_link,
				message: response.message,
				response,
			};
		}
		if ( storedState === 'active' && storedShareLink ) {
			return {
				state: 'active',
				shareLink: storedShareLink,
				message: null,
				response: null,
			};
		}
		if ( storedState ) {
			return {
				state: storedState,
				shareLink: null,
				message: null,
				response: null,
			};
		}
		return { state: 'idle', shareLink: null, message: null, response: null };
	} )();

	const title = sprintf(
		/* translators: %s: directory name (Pocket Casts). */
		__( 'Submit to %s', 'jetpack-podcast' ),
		app.name
	);

	const renderBody = () => {
		if ( ! feedUrl ) {
			return (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'Set your podcast category in the Settings tab to generate your RSS feed URL before submitting.',
						'jetpack-podcast'
					) }
				</Notice>
			);
		}

		if ( isPending ) {
			return (
				<HStack
					alignment="center"
					spacing={ 3 }
					justify="flex-start"
					className="podcast__pocketcasts-status"
				>
					<Spinner />
					<Text>{ __( 'Checking with Pocket Casts…', 'jetpack-podcast' ) }</Text>
				</HStack>
			);
		}

		if ( error ) {
			return (
				<VStack spacing={ 3 }>
					<Notice status="error" isDismissible={ false }>
						{ __( 'We couldn’t reach Pocket Casts. Please try again.', 'jetpack-podcast' ) }
					</Notice>
					<HStack spacing={ 2 } alignment="center" justify="flex-end">
						<Button variant="secondary" __next40pxDefaultSize onClick={ onClose }>
							{ __( 'Close', 'jetpack-podcast' ) }
						</Button>
						<Button variant="primary" __next40pxDefaultSize onClick={ handleRetry }>
							{ __( 'Try again', 'jetpack-podcast' ) }
						</Button>
					</HStack>
				</VStack>
			);
		}

		if ( resolved.state === 'active' ) {
			return (
				<VStack spacing={ 4 } className="podcast__pocketcasts-status">
					<HStack alignment="center" spacing={ 2 } justify="flex-start">
						<Icon
							icon={ check }
							className="podcast__pocketcasts-status-icon podcast__pocketcasts-status-icon--success"
							aria-hidden="true"
						/>
						<Text weight={ 500 }>
							{ __( 'Your podcast is live on Pocket Casts.', 'jetpack-podcast' ) }
						</Text>
					</HStack>
					{ resolved.shareLink && <ShareLinkRow url={ resolved.shareLink } /> }
					<HStack spacing={ 2 } alignment="center" justify="flex-end">
						<Button variant="primary" __next40pxDefaultSize onClick={ onClose }>
							{ __( 'Done', 'jetpack-podcast' ) }
						</Button>
					</HStack>
				</VStack>
			);
		}

		if ( resolved.state === 'pending' ) {
			return (
				<VStack spacing={ 4 } className="podcast__pocketcasts-status">
					<Text>
						{ resolved.message ??
							__(
								'Your feed has been submitted to Pocket Casts. Processing typically takes a few minutes — check back shortly.',
								'jetpack-podcast'
							) }
					</Text>
					<HStack spacing={ 2 } alignment="center" justify="flex-end">
						<Button variant="secondary" __next40pxDefaultSize onClick={ onClose }>
							{ __( 'Close', 'jetpack-podcast' ) }
						</Button>
						<Button variant="primary" __next40pxDefaultSize onClick={ handleSubmit }>
							{ __( 'Refresh status', 'jetpack-podcast' ) }
						</Button>
					</HStack>
				</VStack>
			);
		}

		if ( resolved.state === 'rejected' ) {
			const feedbackErrors = extractFeedbackErrors( resolved.response );
			return (
				<VStack spacing={ 4 } className="podcast__pocketcasts-status">
					<Notice status="error" isDismissible={ false }>
						<Text>
							{ resolved.message ??
								__( 'Pocket Casts could not accept this feed.', 'jetpack-podcast' ) }
						</Text>
						{ feedbackErrors.length > 0 && (
							<ul className="podcast__pocketcasts-feedback-errors">
								{ feedbackErrors.map( msg => (
									<li key={ msg }>{ msg }</li>
								) ) }
							</ul>
						) }
					</Notice>
					<Text variant="muted">
						{ __(
							'You can also submit manually through the Pocket Casts website.',
							'jetpack-podcast'
						) }{ ' ' }
						<ExternalLink href={ app.submitUrl }>
							{ sprintf(
								/* translators: %s: directory name (Pocket Casts). */
								__( 'Open %s', 'jetpack-podcast' ),
								app.name
							) }
						</ExternalLink>
					</Text>
					<HStack spacing={ 2 } alignment="center" justify="flex-end">
						<Button variant="secondary" __next40pxDefaultSize onClick={ onClose }>
							{ __( 'Close', 'jetpack-podcast' ) }
						</Button>
						<Button variant="primary" __next40pxDefaultSize onClick={ handleRetry }>
							{ __( 'Try again', 'jetpack-podcast' ) }
						</Button>
					</HStack>
				</VStack>
			);
		}

		if ( resolved.state === 'unreachable' ) {
			return (
				<VStack spacing={ 4 } className="podcast__pocketcasts-status">
					<Notice status="warning" isDismissible={ false }>
						{ resolved.message ??
							__(
								'Pocket Casts returned an unexpected response. Please try again.',
								'jetpack-podcast'
							) }
					</Notice>
					<HStack spacing={ 2 } alignment="center" justify="flex-end">
						<Button variant="secondary" __next40pxDefaultSize onClick={ onClose }>
							{ __( 'Close', 'jetpack-podcast' ) }
						</Button>
						<Button variant="primary" __next40pxDefaultSize onClick={ handleRetry }>
							{ __( 'Try again', 'jetpack-podcast' ) }
						</Button>
					</HStack>
				</VStack>
			);
		}

		// Idle — first-time CTA.
		return (
			<VStack spacing={ 4 }>
				<Text>
					{ sprintf(
						/* translators: %s: directory name (Pocket Casts). */
						__(
							'We’ll submit your podcast feed to %s for you. Most feeds go live in a few minutes.',
							'jetpack-podcast'
						),
						app.name
					) }
				</Text>
				{ app.learnMoreUrl && (
					<Text variant="muted">
						<ExternalLink href={ app.learnMoreUrl }>
							{ __( 'Learn more', 'jetpack-podcast' ) }
						</ExternalLink>
					</Text>
				) }
				<HStack spacing={ 2 } alignment="center" justify="flex-end">
					<Button variant="secondary" __next40pxDefaultSize onClick={ onClose }>
						{ __( 'Cancel', 'jetpack-podcast' ) }
					</Button>
					<Button variant="primary" __next40pxDefaultSize onClick={ handleSubmit }>
						{ sprintf(
							/* translators: %s: directory name (Pocket Casts). */
							__( 'Submit to %s', 'jetpack-podcast' ),
							app.name
						) }
					</Button>
				</HStack>
			</VStack>
		);
	};

	return (
		<Modal title={ title } onRequestClose={ onClose } className="podcast__pocketcasts-modal">
			{ renderBody() }
		</Modal>
	);
};

export default PocketCastsModal;
