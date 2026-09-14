/**
 * External dependencies
 */
import { GuidelineMessage } from '@automattic/jetpack-ai-client';
/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps, RichText } from '@wordpress/block-editor';
import { Button, Placeholder, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './editor.scss';
import ConnectBanner from '../../shared/components/connect-banner';
import useIsUserConnected from '../../shared/use-is-user-connected';
import EnableJetpackSearchPrompt from './components/nudge-enable-search';
import { DEFAULT_ASK_BUTTON_LABEL, DEFAULT_PLACEHOLDER } from './constants';
import { AiChatControls } from './controls';

const UPGRADE_URL = 'https://jetpack.com/upgrade/search/?utm_source=ai-chat-block';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		askButtonLabel = DEFAULT_ASK_BUTTON_LABEL,
		placeholder = DEFAULT_PLACEHOLDER,
		showCopy,
		showFeedback,
		showSources,
	} = attributes;
	const blockProps = useBlockProps();
	const isBlockSelected = useSelect(
		select => {
			return select( 'core/block-editor' ).isBlockSelected( clientId );
		},
		[ clientId ]
	);
	const isUserConnected = useIsUserConnected();

	// Mirrors the paid-plan gate in ai-chat.php. Defaults to "paid" when the
	// flag isn't localized, so the gate is opt-in via an explicit `false`.
	const supportsPaidSearch = window?.Jetpack_AIChatBlock?.jetpackSettings?.supports_paid_search;

	if ( supportsPaidSearch === false ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					label={ __( 'Jetpack AI Search', 'jetpack' ) }
					instructions={ __(
						'AI-generated answers are part of the paid Jetpack Search plan. Upgrade to let visitors ask questions about your site.',
						'jetpack'
					) }
				>
					<Button variant="primary" href={ UPGRADE_URL } target="_blank" rel="noopener noreferrer">
						{ __( 'Upgrade Jetpack Search', 'jetpack' ) }
					</Button>
				</Placeholder>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			{ ! isUserConnected && <ConnectBanner block="Jetpack AI Search" /> }
			<EnableJetpackSearchPrompt />
			<div className="jetpack-ai-chat-question-wrapper">
				<TextControl
					className="jetpack-ai-chat-question-input"
					placeholder={ placeholder }
					disabled={ true }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
				<RichText
					className="wp-block-button__link jetpack-ai-chat-question-button"
					onChange={ value => setAttributes( { askButtonLabel: value } ) }
					value={ askButtonLabel }
					withoutInteractiveFormatting
					allowedFormats={ [ 'core/bold', 'core/italic', 'core/strikethrough' ] }
				/>
			</div>
			{ isBlockSelected && <GuidelineMessage /> }
			<InspectorControls>
				<AiChatControls
					askButtonLabel={ askButtonLabel }
					placeholder={ placeholder }
					setAttributes={ setAttributes }
					showCopy={ showCopy }
					showFeedback={ showFeedback }
					showSources={ showSources }
				/>
			</InspectorControls>
		</div>
	);
}
