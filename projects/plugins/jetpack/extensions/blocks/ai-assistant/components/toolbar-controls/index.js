/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { image, update, check } from '@wordpress/icons';
/*
 * Internal dependencies
 */
import { PROMPT_TYPE_CHANGE_TONE, PROMPT_TYPE_CHANGE_LANGUAGE } from '../../lib/prompt';
import I18nDropdownControl from '../i18n-dropdown-control';
import ImproveToolbarDropdownMenu from '../improve-dropdown-control';
import PromptTemplatesControl from '../prompt-templates-control';
import ToneToolbarDropdownMenu from '../tone-dropdown-control';

// Consider to enable when we have image support
const isImageGenerationEnabled = false;

const ToolbarControls = ( {
	contentIsLoaded,
	getSuggestionFromOpenAI,
	retryRequest,
	handleAcceptContent,
	handleImageRequest,
	handleTryAgain,
	showRetry,
	contentBefore,
	hasPostTitle,
	wholeContent,
	setUserPrompt,
	recordEvent,
	isGeneratingTitle,
} ) => {
	return (
		<>
			{ contentIsLoaded && (
				<BlockControls group="block">
					<ToneToolbarDropdownMenu
						value="neutral"
						onChange={ tone => {
							recordEvent( 'jetpack_editor_ai_assistant_block_toolbar_button_click', {
								type: 'suggestion',
								suggestion: PROMPT_TYPE_CHANGE_TONE,
							} );
							getSuggestionFromOpenAI( PROMPT_TYPE_CHANGE_TONE, {
								tone,
								contentType: 'generated',
							} );
						} }
						disabled={ contentIsLoaded }
					/>

					<I18nDropdownControl
						value="en"
						onChange={ language => {
							recordEvent( 'jetpack_editor_ai_assistant_block_toolbar_button_click', {
								type: 'suggestion',
								suggestion: PROMPT_TYPE_CHANGE_LANGUAGE,
							} );
							getSuggestionFromOpenAI( PROMPT_TYPE_CHANGE_LANGUAGE, {
								language,
								contentType: 'generated',
							} );
						} }
						disabled={ contentIsLoaded }
					/>

					<ImproveToolbarDropdownMenu
						onChange={ getSuggestionFromOpenAI }
						exclude={ isGeneratingTitle ? [ 'summarize' ] : [] }
					/>
				</BlockControls>
			) }

			<BlockControls>
				{ ! showRetry && ! contentIsLoaded && (
					<PromptTemplatesControl
						hasContentBefore={ !! contentBefore?.length }
						hasContent={ !! wholeContent?.length }
						hasPostTitle={ hasPostTitle }
						onPromptSelect={ prompt => {
							recordEvent( 'jetpack_editor_ai_assistant_block_toolbar_button_click', {
								type: 'prompt-template',
								prompt: prompt.original,
							} );

							setUserPrompt( prompt.translated );
						} }
						onSuggestionSelect={ suggestion => {
							recordEvent( 'jetpack_editor_ai_assistant_block_toolbar_button_click', {
								type: 'suggestion',
								suggestion,
							} );
							getSuggestionFromOpenAI( suggestion );
						} }
					/>
				) }

				<ToolbarGroup>
					{ ! showRetry && contentIsLoaded && (
						<ToolbarButton onClick={ handleTryAgain }>
							{ __( 'Try Again', 'jetpack' ) }
						</ToolbarButton>
					) }

					{ ! showRetry && ! contentIsLoaded && !! wholeContent?.length && (
						<BlockControls group="block">
							<ToneToolbarDropdownMenu
								value="neutral"
								onChange={ tone => {
									recordEvent( 'jetpack_editor_ai_assistant_block_toolbar_button_click', {
										type: 'suggestion',
										suggestion: PROMPT_TYPE_CHANGE_TONE,
									} );
									getSuggestionFromOpenAI( PROMPT_TYPE_CHANGE_TONE, { tone } );
								} }
							/>
							<I18nDropdownControl
								value="en"
								label={ __( 'Translate', 'jetpack' ) }
								onChange={ language => {
									recordEvent( 'jetpack_editor_ai_assistant_block_toolbar_button_click', {
										type: 'suggestion',
										suggestion: PROMPT_TYPE_CHANGE_LANGUAGE,
									} );
									getSuggestionFromOpenAI( PROMPT_TYPE_CHANGE_LANGUAGE, { language } );
								} }
							/>
						</BlockControls>
					) }
					{ showRetry && contentIsLoaded && (
						<ToolbarButton icon={ check } onClick={ handleAcceptContent }>
							{ __( 'Accept', 'jetpack' ) }
						</ToolbarButton>
					) }
					{ showRetry && (
						<ToolbarButton icon={ update } onClick={ retryRequest }>
							{ __( 'Retry', 'jetpack' ) }
						</ToolbarButton>
					) }
				</ToolbarGroup>
				{ isImageGenerationEnabled && ! showRetry && ! contentIsLoaded && (
					// Image/text toggle
					<ToolbarGroup>
						<ToolbarButton icon={ image } onClick={ handleImageRequest }>
							{ __( 'Ask AI for an image', 'jetpack' ) }
						</ToolbarButton>
					</ToolbarGroup>
				) }
			</BlockControls>
		</>
	);
};

export default ToolbarControls;
