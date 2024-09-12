/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { update, check } from '@wordpress/icons';
/*
 * Internal dependencies
 */
import { PROMPT_TYPE_CHANGE_TONE, PROMPT_TYPE_CHANGE_LANGUAGE } from '../../lib/prompt';
import I18nDropdownControl from '../i18n-dropdown-control';
import ImproveToolbarDropdownMenu from '../improve-dropdown-control';
import PromptTemplatesControl from '../prompt-templates-control';
import ToneToolbarDropdownMenu from '../tone-dropdown-control';

const ToolbarControls = ( {
	contentIsLoaded,
	getSuggestionFromOpenAI,
	retryRequest,
	handleAcceptContent,
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
			<BlockControls>
				{ ! showRetry && (
					<>
						<ToolbarGroup>
							<PromptTemplatesControl
								hasContentBefore={ !! contentBefore?.length }
								hasContent={ !! wholeContent?.length }
								hasPostTitle={ hasPostTitle }
								contentIsLoaded={ contentIsLoaded }
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
						</ToolbarGroup>

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
										contentType: contentIsLoaded ? 'generated' : null,
									} );
								} }
								disabled={ ! contentIsLoaded && ! wholeContent?.length }
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
										contentType: contentIsLoaded ? 'generated' : null,
									} );
								} }
								disabled={ ! contentIsLoaded && ! wholeContent?.length }
							/>

							<ImproveToolbarDropdownMenu
								onChange={ getSuggestionFromOpenAI }
								exclude={ isGeneratingTitle ? [ 'summarize' ] : [] }
								disabled={ ! contentIsLoaded }
							/>
						</BlockControls>
					</>
				) }

				{ ( showRetry || handleTryAgain ) && (
					<ToolbarGroup>
						{ ! showRetry && contentIsLoaded && handleTryAgain && (
							<ToolbarButton onClick={ handleTryAgain }>
								{ __( 'Try Again', 'jetpack' ) }
							</ToolbarButton>
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
				) }
			</BlockControls>
		</>
	);
};

export default ToolbarControls;
