/**
 * Default 3-step "submit your feed" modal launched from the Distribution tab.
 *
 * Conforms to `PodcastAppModalProps` so an app's `Modal` field can swap in a
 * custom flow without distribution.tsx caring. Apps that fit this pattern
 * leave `Modal` unset and ride this default; ones with diverging flows (e.g.
 * one-click API submission) ship their own component instead.
 *
 * The submitted-show URL is persisted on the `podcasting_show_urls` site
 * setting (server-side host allowlist enforced by class-settings-rest.php).
 */

import {
	Button,
	ExternalLink,
	Modal,
	TextControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { external, link } from '@wordpress/icons';
import { usePodcastSettings, useUpdatePodcastSettings } from '../hooks/use-podcast-settings';
import type { PodcastAppModalProps } from '../podcast-apps';
import type { FormEvent } from 'react';

const SubmitModal = ( { app, feedUrl, onClose }: PodcastAppModalProps ) => {
	const { data: settings } = usePodcastSettings();
	const { mutate: saveSettings, isPending: isSaving } = useUpdatePodcastSettings();

	const storedUrl = settings?.podcasting_show_urls?.[ app.id ] ?? '';
	const [ draftUrl, setDraftUrl ] = useState( storedUrl );
	const [ hasCopied, setHasCopied ] = useState( false );

	useEffect( () => {
		setDraftUrl( storedUrl );
	}, [ storedUrl ] );

	const copyRef = useCopyToClipboard< HTMLButtonElement >( feedUrl, () => {
		setHasCopied( true );
		setTimeout( () => setHasCopied( false ), 2000 );
	} );

	const handleSave = useCallback(
		( event: FormEvent< HTMLFormElement > ) => {
			event.preventDefault();
			// Send only the changed key — server merges with the stored map.
			saveSettings(
				{ podcasting_show_urls: { [ app.id ]: draftUrl.trim() } },
				{ onSuccess: onClose }
			);
		},
		[ draftUrl, app.id, saveSettings, onClose ]
	);

	const isUnchanged = draftUrl.trim() === storedUrl.trim();

	// Pre-resolve so the i18n-check-webpack-plugin validator sees two distinct
	// __() calls in the bundled output instead of __(cond?'a':'b').
	const copiedLabel = __( 'Copied!', 'jetpack-podcast' );
	const copyLinkLabel = __( 'Copy link', 'jetpack-podcast' );

	const titleText = sprintf(
		/* translators: %s: podcast directory name (e.g. "Apple Podcasts"). */
		__( 'Submit to %s', 'jetpack-podcast' ),
		app.name
	);

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
					<form className="podcast__submit-step-form" onSubmit={ handleSave }>
						<HStack spacing={ 2 } alignment="center" className="podcast__submit-step-row">
							<div className="podcast__submit-step-field">
								<TextControl
									label={ sprintf(
										/* translators: %s: podcast directory name. */
										__( '%s URL', 'jetpack-podcast' ),
										app.name
									) }
									hideLabelFromVision
									value={ draftUrl }
									onChange={ setDraftUrl }
									placeholder="https://"
									type="url"
									__next40pxDefaultSize
									__nextHasNoMarginBottom
								/>
							</div>
							<Button
								variant="primary"
								__next40pxDefaultSize
								type="submit"
								disabled={ isUnchanged || isSaving }
								isBusy={ isSaving }
								accessibleWhenDisabled
							>
								{ __( 'Save', 'jetpack-podcast' ) }
							</Button>
						</HStack>
					</form>
				</VStack>
			</VStack>
		</Modal>
	);
};

export default SubmitModal;
