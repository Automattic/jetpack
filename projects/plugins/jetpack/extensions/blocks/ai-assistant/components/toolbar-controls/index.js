/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarDropdownMenu, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { image, pencil, update, check } from '@wordpress/icons';
/*
 * Internal dependencies
 */
import I18nDropdownControl from '../i18n-dropdown-control';
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
	const dropdownControls = [
		// Interactive controls
		{
			title: __( 'Make longer', 'jetpack' ),
			onClick: () => getSuggestionFromOpenAI( 'makeLonger', { contentType: 'generated' } ),
		},
		{
			title: __( 'Make shorter', 'jetpack' ),
			onClick: () => getSuggestionFromOpenAI( 'makeShorter', { contentType: 'generated' } ),
		},
	];

	if ( ! isGeneratingTitle ) {
		dropdownControls.unshift( {
			title: __( 'Summarize', 'jetpack' ),
			onClick: () => getSuggestionFromOpenAI( 'summarize', { contentType: 'generated' } ),
		} );
	}

	return (
		<>
			{ contentIsLoaded && (
				<BlockControls group="block">
					<ToneToolbarDropdownMenu
						value="neutral"
						onChange={ tone =>
							getSuggestionFromOpenAI( 'changeTone', { tone, contentType: 'generated' } )
						}
						disabled={ contentIsLoaded }
					/>

					<I18nDropdownControl
						value="en"
						onChange={ language =>
							getSuggestionFromOpenAI( 'changeLanguage', { language, contentType: 'generated' } )
						}
						disabled={ contentIsLoaded }
					/>

					<ToolbarDropdownMenu
						icon={ pencil }
						label={ __( 'Improve', 'jetpack' ) }
						controls={ dropdownControls }
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
								prompt,
							} );

							setUserPrompt( prompt );
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
								onChange={ tone => getSuggestionFromOpenAI( 'changeTone', { tone } ) }
							/>
							<I18nDropdownControl
								value="en"
								label={ __( 'Translate', 'jetpack' ) }
								onChange={ language => getSuggestionFromOpenAI( 'changeLanguage', { language } ) }
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
