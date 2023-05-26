/**
 * External dependencies
 */
import { useBreakpointMatch } from '@automattic/jetpack-components';
import { BlockControls, PlainText } from '@wordpress/block-editor';
import {
	Button,
	Icon,
	ToolbarButton,
	ToolbarDropdownMenu,
	ToolbarGroup,
	Spinner,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, image, pencil, update, title, closeSmall } from '@wordpress/icons';
/*
 * Internal dependencies
 */
import useAIFeature from './hooks/use-ai-feature';
import I18nDropdownControl from './i18n-dropdown-control';
import AIAssistantIcon from './icons/ai-assistant';
import origamiPlane from './icons/origami-plane';
import PromptTemplatesControl from './prompt-templates-control';
import ToneDropdownControl from './tone-dropdown-control';
import UpgradePrompt from './upgrade-prompt';

const AIControl = ( {
	contentIsLoaded,
	getSuggestionFromOpenAI,
	retryRequest,
	handleAcceptContent,
	handleAcceptTitle,
	handleTryAgain,
	handleGetSuggestion,
	handleStopSuggestion,
	handleImageRequest,
	isWaitingState,
	loadingImages,
	userPrompt,
	setUserPrompt,
	showRetry,
	contentBefore,
	postTitle,
	wholeContent,
	promptType,
	onChange,
} ) => {
	const promptUserInputRef = useRef( null );
	const [ isSm ] = useBreakpointMatch( 'sm' );

	const handleInputEnter = event => {
		if ( event.key === 'Enter' && ! event.shiftKey ) {
			event.preventDefault();
			handleGetSuggestion( 'userPrompt' );
		}
	};

	const { requireUpgrade } = useAIFeature();

	const textPlaceholder = __( 'Ask Jetpack AI', 'jetpack' );

	let placeholder = '';

	if ( isWaitingState ) {
		if ( userPrompt?.length ) {
			placeholder = userPrompt;
		} else {
			placeholder = __( 'AI writing', 'jetpack' );
		}
	} else {
		placeholder = textPlaceholder;
	}

	return (
		<>
			{ requireUpgrade && <UpgradePrompt /> }
			{ ! isWaitingState && (
				<ToolbarControls
					isWaitingState={ isWaitingState }
					contentIsLoaded={ contentIsLoaded }
					getSuggestionFromOpenAI={ getSuggestionFromOpenAI }
					retryRequest={ retryRequest }
					handleAcceptContent={ handleAcceptContent }
					handleAcceptTitle={ handleAcceptTitle }
					handleGetSuggestion={ handleGetSuggestion }
					handleImageRequest={ handleImageRequest }
					handleTryAgain={ handleTryAgain }
					showRetry={ showRetry }
					contentBefore={ contentBefore }
					hasPostTitle={ !! postTitle?.length }
					wholeContent={ wholeContent }
					promptType={ promptType }
					setUserPrompt={ prompt => {
						if ( ! promptUserInputRef?.current ) {
							return;
						}

						const userPromptInput = promptUserInputRef.current;

						// Focus the text area
						userPromptInput.focus();

						// Add a typing effect in the text area
						for ( let i = 0; i < prompt.length; i++ ) {
							setTimeout( () => {
								setUserPrompt( prompt.slice( 0, i + 1 ) );
							}, 25 * i );
						}
					} }
				/>
			) }
			<div className="jetpack-ai-assistant__input-wrapper">
				<div className="jetpack-ai-assistant__input-icon-wrapper">
					{ isWaitingState || loadingImages ? (
						<Spinner className="jetpack-ai-assistant__input-spinner" />
					) : (
						<Icon
							icon={ AIAssistantIcon }
							size={ 24 }
							className="jetpack-ai-assistant__input-icon"
						/>
					) }
				</div>
				<PlainText
					value={ isWaitingState ? '' : userPrompt }
					onChange={ value => {
						setUserPrompt( value );
						onChange?.();
					} }
					onKeyPress={ handleInputEnter }
					placeholder={ placeholder }
					className="jetpack-ai-assistant__input"
					disabled={ isWaitingState || loadingImages }
					ref={ promptUserInputRef }
				/>

				<div className="jetpack-ai-assistant__controls">
					{ ! isWaitingState ? (
						<Button
							className="jetpack-ai-assistant__prompt_button"
							onClick={ () => handleGetSuggestion( 'userPrompt' ) }
							isSmall={ true }
							disabled={ ! userPrompt?.length }
							label={ __( 'Send request', 'jetpack' ) }
						>
							<Icon icon={ origamiPlane } />
							{ ! isSm && __( 'Send', 'jetpack' ) }
						</Button>
					) : (
						<Button
							className="jetpack-ai-assistant__prompt_button"
							onClick={ handleStopSuggestion }
							isSmall={ true }
							label={ __( 'Stop request', 'jetpack' ) }
						>
							<Icon icon={ closeSmall } />
							{ __( 'Stop', 'jetpack' ) }
						</Button>
					) }
				</div>
			</div>
		</>
	);
};

export default AIControl;

// Consider to enable when we have image support
const isImageGenerationEnabled = false;

function GenerateContentButton( {
	showRetry,
	contentIsLoaded,
	contentBefore,
	hasPostTitle,
	onAction,
} ) {
	if ( ! showRetry && ! contentIsLoaded && contentBefore?.length ) {
		return (
			<ToolbarButton icon={ pencil } onClick={ () => onAction( 'continue' ) }>
				{ __( 'Continue writing', 'jetpack' ) }
			</ToolbarButton>
		);
	}

	if ( ! showRetry && ! contentIsLoaded && ! contentBefore?.length && hasPostTitle ) {
		return (
			<ToolbarButton icon={ title } onClick={ () => onAction( 'titleSummary' ) }>
				{ __( 'Write a summary based on title', 'jetpack' ) }
			</ToolbarButton>
		);
	}

	return null;
}

const ToolbarControls = ( {
	contentIsLoaded,
	getSuggestionFromOpenAI,
	retryRequest,
	handleAcceptContent,
	handleAcceptTitle,
	handleImageRequest,
	handleTryAgain,
	showRetry,
	contentBefore,
	hasPostTitle,
	wholeContent,
	promptType,
	setUserPrompt,
} ) => {
	return (
		<>
			{ contentIsLoaded && (
				<BlockControls group="block">
					<ToneDropdownControl
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
						controls={ [
							// Interactive controls
							{
								title: __( 'Summarize', 'jetpack' ),
								onClick: () => getSuggestionFromOpenAI( 'summarize', { contentType: 'generated' } ),
							},
							{
								title: __( 'Make longer', 'jetpack' ),
								onClick: () =>
									getSuggestionFromOpenAI( 'makeLonger', { contentType: 'generated' } ),
							},
							{
								title: __( 'Make shorter', 'jetpack' ),
								onClick: () =>
									getSuggestionFromOpenAI( 'makeShorter', { contentType: 'generated' } ),
							},
						] }
					/>
				</BlockControls>
			) }

			<BlockControls>
				{ /* Text controls */ }

				<BlockControls group="block">
					<PromptTemplatesControl onPromptSelected={ setUserPrompt } />
				</BlockControls>

				<ToolbarGroup>
					{ ! showRetry && contentIsLoaded && (
						<>
							{ promptType === 'generateTitle' ? (
								<ToolbarButton onClick={ handleAcceptTitle }>
									{ __( 'Accept title', 'jetpack' ) }
								</ToolbarButton>
							) : (
								<ToolbarButton onClick={ handleAcceptContent }>
									{ __( 'Done', 'jetpack' ) }
								</ToolbarButton>
							) }
							<ToolbarButton onClick={ handleTryAgain }>
								{ __( 'Try Again', 'jetpack' ) }
							</ToolbarButton>
						</>
					) }

					<GenerateContentButton
						showRetry={ showRetry }
						contentIsLoaded={ contentIsLoaded }
						contentBefore={ contentBefore }
						hasPostTitle={ hasPostTitle }
						onAction={ getSuggestionFromOpenAI }
					/>

					{ ! showRetry && ! contentIsLoaded && !! wholeContent?.length && (
						<I18nDropdownControl
							value="en"
							label={ __( 'Translate', 'jetpack' ) }
							onChange={ language => getSuggestionFromOpenAI( 'changeLanguage', { language } ) }
						/>
					) }

					{ ! showRetry && ! contentIsLoaded && (
						<ToolbarDropdownMenu
							icon={ chevronDown }
							label={ __( 'Generate and improve', 'jetpack' ) }
							controls={ [
								{
									title: __( 'Summarize', 'jetpack' ),
									onClick: () => getSuggestionFromOpenAI( 'summarize' ),
									isDisabled: ! wholeContent?.length,
								},
								{
									title: __( 'Write a summary based on title', 'jetpack' ),
									onClick: () => getSuggestionFromOpenAI( 'titleSummary' ),
									isDisabled: ! hasPostTitle,
								},
								{
									title: __( 'Expand on preceding content', 'jetpack' ),
									onClick: () => getSuggestionFromOpenAI( 'continue' ),
									isDisabled: ! contentBefore?.length,
								},
								{
									title: __( 'Correct spelling and grammar of preceding content', 'jetpack' ),
									onClick: () => getSuggestionFromOpenAI( 'correctSpelling' ),
									isDisabled: ! contentBefore?.length,
								},
								{
									title: __( 'Simplify preceding content', 'jetpack' ),
									onClick: () => getSuggestionFromOpenAI( 'simplify' ),
									isDisabled: ! contentBefore?.length,
								},
								{
									title: __( 'Generate a post title', 'jetpack' ),
									onClick: () => getSuggestionFromOpenAI( 'generateTitle' ),
									isDisabled: ! wholeContent?.length,
								},
							] }
						/>
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
