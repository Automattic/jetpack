/**
 * Default 3-step "submit your feed" modal launched from the Distribution tab.
 *
 * Conforms to `PodcastAppModalProps` so an app's `Modal` field can swap in a
 * custom flow without distribution.tsx caring. Apps that fit this pattern
 * leave `Modal` unset and ride this default; ones with diverging flows (e.g.
 * one-click API submission) ship their own component instead.
 *
 * The submitted-show URL is persisted on the `podcasting_show_urls` site
 * setting. The host allowlist is enforced server-side; we mirror it here
 * (PodcastApp.showHosts) so we can fail-fast on the client and surface an
 * inline error rather than silently dropping the user's input.
 */

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
import type { PodcastAppModalProps } from '../podcast-apps';
import type { FormEvent } from 'react';

// Mirrors SHOW_URL_MAX_LENGTH in src/rest/class-settings-rest.php.
const SHOW_URL_MAX_LENGTH = 2048;

// `prependHTTPS` adds the scheme for bare hosts but leaves an existing
// `http://` alone — the backend rejects non-https, so upgrade ourselves.
const normalizeShowUrl = ( raw: string ): string =>
	prependHTTPS( raw.trim() ).replace( /^http:\/\//i, 'https://' );

// Mirrors the per-podcatcher allowlist + esc_url_raw + wp_http_validate_url
// gauntlet the backend runs each save through. Empty input is rejected here
// so the modal never silently deletes a stored entry by clearing the field.
const isValidShowUrl = ( url: string, allowedHosts: readonly string[] ): boolean => {
	if ( url === '' || url.length > SHOW_URL_MAX_LENGTH ) {
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

const SubmitModal = ( { app, feedUrl, onClose }: PodcastAppModalProps ) => {
	const { data: settings } = usePodcastSettings();
	const { mutate: saveSettings, isPending: isSaving } = useUpdatePodcastSettings();

	const storedUrl = settings?.podcasting_show_urls?.[ app.id ] ?? '';
	const [ draftUrl, setDraftUrl ] = useState( storedUrl );
	const [ hasCopied, setHasCopied ] = useState( false );
	const [ isEditing, setIsEditing ] = useState( false );
	const [ saveError, setSaveError ] = useState< string | null >( null );
	const inputContainerRef = useRef< HTMLDivElement >( null );
	// `storedUrl` may be empty on mount if settings haven't hydrated yet;
	// once it lands, mirror it into the draft. Flipped to true the moment
	// the draft is touched (sync, typing, or Replace) so late hydration
	// can never clobber input the user has already started.
	const hasInitializedDraft = useRef( !! storedUrl );
	// Set when Replace is clicked so the post-render effect knows to focus
	// the now-mounted input. Don't trigger on every isEditing flip — typing
	// also flips it, and stealing focus mid-keystroke is disruptive.
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

	const copyRef = useCopyToClipboard< HTMLButtonElement >( feedUrl, () => {
		setHasCopied( true );
		setTimeout( () => setHasCopied( false ), 2000 );
	} );

	const handleReplace = useCallback( () => {
		hasInitializedDraft.current = true;
		shouldFocusInputRef.current = true;
		setDraftUrl( storedUrl );
		setSaveError( null );
		setIsEditing( true );
	}, [ storedUrl ] );

	const handleDraftChange = useCallback( ( value: string ) => {
		hasInitializedDraft.current = true;
		// Pin the form open so a late `storedUrl` hydration can't swap us
		// back to the saved/read-only view mid-keystroke.
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
					sprintf(
						/* translators: %s: podcast directory name (e.g. "Apple Podcasts"). */
						__( 'Enter a valid %s URL.', 'jetpack-podcast' ),
						app.name
					)
				);
				return;
			}
			setSaveError( null );
			saveSettings(
				{ podcasting_show_urls: { [ app.id ]: normalizedDraft } },
				{
					onSuccess: () => {
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
		[ normalizedDraft, app.showHosts, app.id, app.name, saveSettings, onClose ]
	);

	// Pre-resolve so the i18n-check-webpack-plugin validator sees two distinct
	// __() calls in the bundled output instead of __(cond?'a':'b').
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
					{ app.step2Extra }
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
						<form className="podcast__submit-step-form" onSubmit={ handleSave }>
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
