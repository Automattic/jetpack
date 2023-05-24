/**
 * External dependencies
 */
import { BlockControls, PlainText } from '@wordpress/block-editor';
import {
	Button,
	Icon,
	ToolbarButton,
	ToolbarDropdownMenu,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { arrowRight, chevronDown, image, pencil, update, title } from '@wordpress/icons';
/*
 * Internal dependencies
 */
import I18nDropdownControl from './i18n-dropdown-control';
import AIAssistantIcon from './icons/ai-assistant';
import LoadingIcon from './icons/loading';
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
	handleImageRequest,
	isWaitingState,
	loadingImages,
	userPrompt,
	setUserPrompt,
	showRetry,
	contentBefore,
	postTitle,
	wholeContent,
	content,
	promptType,
	onChange,
} ) => {
	const handleInputEnter = event => {
		if ( event.key === 'Enter' && ! event.shiftKey ) {
			event.preventDefault();
			handleGetSuggestion( 'userPrompt' );
		}
	};

	const textPlaceholder = ! content?.length
		? __( 'Ask Jetpack AI for anything…', 'jetpack' )
		: __( 'Tell AI what to do next…', 'jetpack', /* dummy arg to avoid bad minification */ 0 );

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
			{ false && <UpgradePrompt /> }
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
				/>
			) }
			<div className="jetpack-ai-assistant__input-wrapper">
				<div className="jetpack-ai-assistant__input-icon-wrapper">
					{ isWaitingState || loadingImages ? (
						<Icon
							icon={ LoadingIcon }
							size={ 24 }
							className="jetpack-ai-assistant__input-loader-icon"
						/>
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
				/>

				<div className="jetpack-ai-assistant__controls">
					<Button
						className="jetpack-ai-assistant__prompt_button"
						onClick={ () => handleGetSuggestion( 'userPrompt' ) }
						isSmall={ true }
						disabled={ isWaitingState || ! userPrompt?.length }
						label={ __( 'Do some magic!', 'jetpack' ) }
					>
						<Icon icon={ arrowRight } />
					</Button>
				</div>
			</div>
		</>
	);
};

export default AIControl;

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
							{
								title: __( 'Correct spelling and grammar', 'jetpack' ),
								onClick: () =>
									getSuggestionFromOpenAI( 'correctSpelling', { contentType: 'generated' } ),
							},
						] }
					/>
				</BlockControls>
			) }

			<BlockControls>
				{ /* Text controls */ }
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

					{ !! ( ! showRetry && ! contentIsLoaded && contentBefore?.length ) && (
						<ToolbarButton icon={ pencil } onClick={ () => getSuggestionFromOpenAI( 'continue' ) }>
							{ __( 'Continue writing', 'jetpack' ) }
						</ToolbarButton>
					) }

					{ ! showRetry && ! contentIsLoaded && ! contentBefore?.length && hasPostTitle && (
						<ToolbarButton
							icon={ title }
							onClick={ () => getSuggestionFromOpenAI( 'titleSummary' ) }
						>
							{ __( 'Write a summary based on title', 'jetpack' ) }
						</ToolbarButton>
					) }

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
				{ ! showRetry && ! contentIsLoaded && (
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
