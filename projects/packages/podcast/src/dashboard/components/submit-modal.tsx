/**
 * Three-step "submit your feed" modal launched from the Distribution tab.
 *
 * Ported from Calypso's `client/my-sites/podcast/components/submit-modal.tsx`,
 * minus the confetti animation (a Calypso-only component) and the Redux site-id
 * lookup (the Jetpack version uses the site URL from script data as a stable
 * key for localStorage).
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
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { external, link } from '@wordpress/icons';
import { usePodcatcherUrl } from '../hooks/use-podcatcher-url';
import type { FormEvent } from 'react';

export interface Podcatcher {
	id: string;
	name: string;
	submitUrl: string;
	learnMoreUrl?: string;
}

interface SubmitModalProps {
	feedUrl: string;
	siteUrl: string;
	podcatcher: Podcatcher;
	onClose: () => void;
}

const COPIED_FEEDBACK_MS = 2000;

const SubmitModal = ( { feedUrl, siteUrl, podcatcher, onClose }: SubmitModalProps ) => {
	const [ storedUrl, setStoredUrl ] = usePodcatcherUrl( siteUrl, podcatcher.id );
	const [ draftUrl, setDraftUrl ] = useState( storedUrl );
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );

	useEffect( () => {
		setDraftUrl( storedUrl );
	}, [ storedUrl ] );

	useEffect(
		() => () => {
			if ( copyTimeoutRef.current ) {
				clearTimeout( copyTimeoutRef.current );
			}
		},
		[]
	);

	const handleCopy = useCallback( () => {
		if ( ! feedUrl || ! navigator.clipboard?.writeText ) {
			return;
		}
		navigator.clipboard
			.writeText( feedUrl )
			.then( () => {
				setHasCopied( true );
				if ( copyTimeoutRef.current ) {
					clearTimeout( copyTimeoutRef.current );
				}
				copyTimeoutRef.current = setTimeout( () => setHasCopied( false ), COPIED_FEEDBACK_MS );
			} )
			.catch( () => {
				// Clipboard write rejection is silent — user just keeps seeing the original button label.
			} );
	}, [ feedUrl ] );

	const handleSave = useCallback(
		( event: FormEvent< HTMLFormElement > ) => {
			event.preventDefault();
			setStoredUrl( draftUrl.trim() );
			onClose();
		},
		[ draftUrl, setStoredUrl, onClose ]
	);

	const isUnchanged = draftUrl.trim() === storedUrl.trim();

	const titleText = sprintf(
		/* translators: %s: podcast directory name (e.g. "Apple Podcasts"). */
		__( 'Submit to %s', 'jetpack-podcast' ),
		podcatcher.name
	);

	const step2Note =
		podcatcher.id === 'pocketcasts'
			? __( 'Choose the Public option, since this feed is for your listeners.', 'jetpack-podcast' )
			: null;

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
									podcatcher.name
							  )
							: __(
									'Set your podcast category in the Settings tab to generate your RSS feed URL.',
									'jetpack-podcast'
							  ) }
					</Text>
					{ feedUrl && (
						<Button
							className="podcast__submit-copy-button"
							variant="secondary"
							__next40pxDefaultSize
							icon={ link }
							iconPosition="left"
							onClick={ handleCopy }
						>
							{ hasCopied
								? __( 'Copied!', 'jetpack-podcast' )
								: __( 'Copy link', 'jetpack-podcast' ) }
						</Button>
					) }
				</VStack>

				<VStack as="li" spacing={ 3 } className="podcast__submit-step">
					<h2 className="podcast__submit-step-title">
						{ sprintf(
							/* translators: %s: podcast directory name. */
							__( 'Step 2: Submit your podcast to %s', 'jetpack-podcast' ),
							podcatcher.name
						) }
					</h2>
					<Text as="p" variant="muted">
						{ sprintf(
							/* translators: %s: podcast directory name. */
							__(
								'Click the button below to visit %s and complete their sign up flow.',
								'jetpack-podcast'
							),
							podcatcher.name
						) }
					</Text>
					{ podcatcher.learnMoreUrl && (
						<Text as="p" variant="muted">
							<ExternalLink href={ podcatcher.learnMoreUrl }>
								{ __( 'Learn more', 'jetpack-podcast' ) }
							</ExternalLink>
						</Text>
					) }
					{ step2Note && (
						<Text as="p" variant="muted">
							{ step2Note }
						</Text>
					) }
					<Button
						variant="secondary"
						__next40pxDefaultSize
						icon={ external }
						iconPosition="right"
						href={ podcatcher.submitUrl }
						target="_blank"
						rel="noopener noreferrer"
						aria-label={ sprintf(
							/* translators: %s: podcast directory name. */
							__( 'Visit %s (opens in a new tab)', 'jetpack-podcast' ),
							podcatcher.name
						) }
					>
						{ sprintf(
							/* translators: %s: podcast directory name. */
							__( 'Visit %s', 'jetpack-podcast' ),
							podcatcher.name
						) }
					</Button>
				</VStack>

				<VStack as="li" spacing={ 3 } className="podcast__submit-step">
					<h2 className="podcast__submit-step-title">
						{ sprintf(
							/* translators: %s: podcast directory name. */
							__( 'Step 3: Enter your %s URL', 'jetpack-podcast' ),
							podcatcher.name
						) }
					</h2>
					<Text as="p" variant="muted">
						{ sprintf(
							/* translators: %s: podcast directory name. */
							__(
								'Paste your new %s URL into the field below and we’ll use it for your sharing buttons.',
								'jetpack-podcast'
							),
							podcatcher.name
						) }
					</Text>
					<form className="podcast__submit-step-form" onSubmit={ handleSave }>
						<HStack spacing={ 2 } alignment="center" className="podcast__submit-step-row">
							<div className="podcast__submit-step-field">
								<TextControl
									label={ sprintf(
										/* translators: %s: podcast directory name. */
										__( '%s URL', 'jetpack-podcast' ),
										podcatcher.name
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
								disabled={ isUnchanged }
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
