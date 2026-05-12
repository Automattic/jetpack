// Default 3-step modal. Apps with diverging flows (one-click API submission,
// etc.) set their own `Modal` on the PodcastApp to bypass this.

import jetpackAnalytics from '@automattic/jetpack-analytics';
import {
	Button,
	ExternalLink,
	Icon,
	Modal,
	Notice,
	TextControl,
	VisuallyHidden,
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
import { check, external, link } from '@wordpress/icons';
import { prependHTTPS } from '@wordpress/url';
import { usePodcastSettings, useUpdatePodcastSettings } from '../hooks/use-podcast-settings';
import type { PodcastAppModalProps } from './podcast-apps';
import type { FormEvent } from 'react';

// Mirrors `SHOW_URL_MAX_LENGTH` in src/class-settings.php.
const SHOW_URL_MAX_LENGTH = 2048;

// `prependHTTPS` leaves an existing `http://` alone, but the backend rejects
// non-https — upgrade ourselves.
const normalizeShowUrl = ( raw: string ): string =>
	prependHTTPS( raw.trim() ).replace( /^http:\/\//i, 'https://' );

const isValidShowUrl = ( url: string, allowedHosts: readonly string[] ): boolean => {
	if ( ! url ) {
		return false;
	}
	if ( url.length > SHOW_URL_MAX_LENGTH ) {
		return false;
	}
	let parsed: URL;
	try {
		parsed = new URL( url );
	} catch {
		return false;
	}
	if ( parsed.protocol !== 'https:' ) {
		return false;
	}
	const host = parsed.hostname.toLowerCase().replace( /^www\./, '' );
	return allowedHosts.includes( host );
};

const SubmitModal = ( { app, feedUrl, onClose, onFirstSave }: PodcastAppModalProps ) => {
	const { data: settings } = usePodcastSettings();
	const { mutate: saveSettings, isPending: isSaving } = useUpdatePodcastSettings();

	const storedUrl = settings?.podcasting_show_urls?.[ app.id ] ?? '';
	// `null` until settings hydrate; skip confetti rather than guess.
	const allStoredUrls = settings?.podcasting_show_urls;
	const hadAnyStoredUrl = allStoredUrls
		? Object.values( allStoredUrls ).some( ( url ): url is string => !! url )
		: null;
	const [ draftUrl, setDraftUrl ] = useState( storedUrl );
	const [ hasCopied, setHasCopied ] = useState( false );
	const [ isEditing, setIsEditing ] = useState( false );
	const [ saveError, setSaveError ] = useState< string | null >( null );
	const inputContainerRef = useRef< HTMLDivElement >( null );
	// Flipped true the moment the draft is touched so a late settings hydration
	// can't clobber input the user has already started.
	const hasInitializedDraft = useRef( !! storedUrl );
	// Only true when Replace was clicked, so typing (which also flips isEditing)
	// doesn't steal focus mid-keystroke.
	const shouldFocusInputRef = useRef( false );

	useEffect( () => {
		if ( ! hasInitializedDraft.current && storedUrl ) {
			hasInitializedDraft.current = true;
			setDraftUrl( storedUrl );
		}
	}, [ storedUrl ] );

	useEffect( () => {
		if ( ! shouldFocusInputRef.current || ! isEditing ) {
			return;
		}
		shouldFocusInputRef.current = false;
		const input = inputContainerRef.current?.querySelector( 'input' );
		input?.focus();
		input?.select();
	}, [ isEditing ] );

	const copyRef = useCopyToClipboard< HTMLButtonElement >( feedUrl, () => setHasCopied( true ) );

	useEffect( () => {
		if ( ! hasCopied ) {
			return;
		}
		const timer = setTimeout( () => setHasCopied( false ), 2000 );
		return () => clearTimeout( timer );
	}, [ hasCopied ] );

	const handleReplace = useCallback( () => {
		hasInitializedDraft.current = true;
		shouldFocusInputRef.current = true;
		setDraftUrl( storedUrl );
		setSaveError( null );
		setIsEditing( true );
	}, [ storedUrl ] );

	const handleDraftChange = useCallback( ( value: string ) => {
		hasInitializedDraft.current = true;
		// Pin the form open so a late hydration can't swap to the saved view
		// mid-keystroke.
		setIsEditing( true );
		setDraftUrl( value );
		setSaveError( null );
	}, [] );

	const handleDismissError = useCallback( () => setSaveError( null ), [] );

	const normalizedDraft = normalizeShowUrl( draftUrl );
	const isUnchanged = draftUrl === storedUrl;

	const handleSave = useCallback(
		( event: FormEvent< HTMLFormElement > ) => {
			event.preventDefault();
			if ( ! isValidShowUrl( normalizedDraft, app.showHosts ) ) {
				setSaveError(
					normalizedDraft.length > SHOW_URL_MAX_LENGTH
						? sprintf(
								/* translators: %s: podcast directory name (e.g. "Apple Podcasts"). */
								__( 'Your %s URL is too long.', 'jetpack-podcast' ),
								app.name
						  )
						: sprintf(
								/* translators: %s: podcast directory name (e.g. "Apple Podcasts"). */
								__( 'Enter a valid %s URL.', 'jetpack-podcast' ),
								app.name
						  )
				);
				return;
			}
			setSaveError( null );
			// Snapshot — `storedUrl` flips post-save and would mis-classify.
			const isReplace = !! storedUrl;
			const isFirstSave = ! storedUrl;
			const isFirstEverSave = hadAnyStoredUrl === null ? false : ! hadAnyStoredUrl;
			saveSettings(
				{ podcasting_show_urls: { [ app.id ]: normalizedDraft } },
				{
					onSuccess: result => {
						// The wpcom endpoint returns 200 even when `wp_http_validate_url`
						// rejects the value (stored field stays unchanged). Round-trip the
						// value to catch silent drops.
						const persisted = result.podcasting_show_urls?.[ app.id ] ?? '';
						if ( persisted !== normalizedDraft ) {
							setSaveError(
								sprintf(
									/* translators: %s: podcast directory name. */
									__( 'We couldn’t save your %s URL. Please try again.', 'jetpack-podcast' ),
									app.name
								)
							);
							return;
						}
						jetpackAnalytics.tracks.recordEvent( 'jetpack_podcast_show_url_saved', {
							directory: app.id,
							is_first_save: isFirstSave,
							is_replace: isReplace,
						} );
						if ( isFirstEverSave ) {
							onFirstSave?.();
						}
						setIsEditing( false );
						onClose();
					},
					onError: () => {
						setSaveError(
							sprintf(
								/* translators: %s: podcast directory name. */
								__( 'We couldn’t save your %s URL. Please try again.', 'jetpack-podcast' ),
								app.name
							)
						);
					},
				}
			);
		},
		[
			normalizedDraft,
			app.showHosts,
			app.id,
			app.name,
			saveSettings,
			storedUrl,
			hadAnyStoredUrl,
			onFirstSave,
			onClose,
		]
	);

	// Hoisted so terser can't fold them into __(cond?'a':'b') — the i18n-check
	// validator rejects that shape.
	const copiedLabel = __( 'Copied!', 'jetpack-podcast' );
	const copyLinkLabel = __( 'Copy link', 'jetpack-podcast' );

	const titleText = sprintf(
		/* translators: %s: podcast directory name (e.g. "Apple Podcasts"). */
		__( 'Submit to %s', 'jetpack-podcast' ),
		app.name
	);

	const showSavedReadOnly = !! storedUrl && ! isEditing;

	return (
		<Modal title={ titleText } onRequestClose={ onClose } className="podcast__submit-modal">
			<VStack as="ol" spacing={ 5 } className="podcast__submit-steps">
				<VStack as="li" spacing={ 3 } className="podcast__submit-step">
					<h2 className="podcast__submit-step-title">
						{ __( 'Step 1: Copy your RSS feed URL', 'jetpack-podcast' ) }
					</h2>
					<Text as="p" variant="muted">
						{ feedUrl
							? sprintf(
									/* translators: %s: podcast directory name. */
									__(
										'Click the button below to copy your RSS feed URL. %s will require this URL to list your podcast.',
										'jetpack-podcast'
									),
									app.name
							  )
							: __(
									'Set your podcast category in the Settings tab to generate your RSS feed URL.',
									'jetpack-podcast'
							  ) }
					</Text>
					{ feedUrl && (
						<Button
							ref={ copyRef }
							className="podcast__submit-copy-button"
							variant="secondary"
							__next40pxDefaultSize
							icon={ link }
							iconPosition="left"
						>
							{ hasCopied ? copiedLabel : copyLinkLabel }
						</Button>
					) }
				</VStack>

				<VStack as="li" spacing={ 3 } className="podcast__submit-step">
					<h2 className="podcast__submit-step-title">
						{ sprintf(
							/* translators: %s: podcast directory name. */
							__( 'Step 2: Submit your podcast to %s', 'jetpack-podcast' ),
							app.name
						) }
					</h2>
					<Text as="p" variant="muted">
						{ sprintf(
							/* translators: %s: podcast directory name. */
							__(
								'Click the button below to visit %s and complete their sign up flow.',
								'jetpack-podcast'
							),
							app.name
						) }
					</Text>
					{ app.learnMoreUrl && (
						<Text as="p" variant="muted">
							<ExternalLink href={ app.learnMoreUrl }>
								{ __( 'Learn more', 'jetpack-podcast' ) }
							</ExternalLink>
						</Text>
					) }
					<Button
						variant="secondary"
						__next40pxDefaultSize
						icon={ external }
						iconPosition="right"
						href={ app.submitUrl }
						target="_blank"
						rel="noopener noreferrer"
						aria-label={ sprintf(
							/* translators: %s: podcast directory name. */
							__( 'Visit %s (opens in a new tab)', 'jetpack-podcast' ),
							app.name
						) }
					>
						{ sprintf(
							/* translators: %s: podcast directory name. */
							__( 'Visit %s', 'jetpack-podcast' ),
							app.name
						) }
					</Button>
				</VStack>

				<VStack as="li" spacing={ 3 } className="podcast__submit-step">
					<h2 className="podcast__submit-step-title">
						{ sprintf(
							/* translators: %s: podcast directory name. */
							__( 'Step 3: Enter your %s URL', 'jetpack-podcast' ),
							app.name
						) }
					</h2>
					<Text as="p" variant="muted">
						{ sprintf(
							/* translators: %s: podcast directory name. */
							__(
								'Paste your new %s URL into the field below and we’ll use it for your sharing buttons.',
								'jetpack-podcast'
							),
							app.name
						) }
					</Text>
					{ showSavedReadOnly ? (
						<HStack spacing={ 2 } alignment="center" className="podcast__submit-step-row">
							<HStack
								spacing={ 2 }
								alignment="center"
								expanded={ false }
								justify="flex-start"
								className="podcast__submit-step-saved"
							>
								<Icon
									icon={ check }
									className="podcast__submit-step-saved-icon"
									aria-hidden="true"
								/>
								<VisuallyHidden>{ __( 'Saved:', 'jetpack-podcast' ) }</VisuallyHidden>
								<Text className="podcast__submit-step-saved-url" title={ storedUrl }>
									{ storedUrl }
								</Text>
							</HStack>
							<Button
								variant="secondary"
								__next40pxDefaultSize
								aria-label={ sprintf(
									/* translators: %s: podcast directory name. */
									__( 'Replace %s URL', 'jetpack-podcast' ),
									app.name
								) }
								onClick={ handleReplace }
							>
								{ __( 'Replace', 'jetpack-podcast' ) }
							</Button>
						</HStack>
					) : (
						<form onSubmit={ handleSave }>
							<HStack spacing={ 2 } alignment="center" className="podcast__submit-step-row">
								<div className="podcast__submit-step-field" ref={ inputContainerRef }>
									<TextControl
										label={ sprintf(
											/* translators: %s: podcast directory name. */
											__( '%s URL', 'jetpack-podcast' ),
											app.name
										) }
										hideLabelFromVision
										value={ draftUrl }
										onChange={ handleDraftChange }
										placeholder="https://"
										type="text"
										inputMode="url"
										__next40pxDefaultSize
										__nextHasNoMarginBottom
									/>
								</div>
								<Button
									variant="primary"
									__next40pxDefaultSize
									type="submit"
									disabled={ ! normalizedDraft || isUnchanged || isSaving }
									isBusy={ isSaving }
									accessibleWhenDisabled
								>
									{ __( 'Save', 'jetpack-podcast' ) }
								</Button>
							</HStack>
							{ saveError && (
								<Notice
									status="error"
									isDismissible
									onRemove={ handleDismissError }
									className="podcast__submit-step-notice"
								>
									{ saveError }
								</Notice>
							) }
						</form>
					) }
				</VStack>
			</VStack>
		</Modal>
	);
};

export default SubmitModal;
