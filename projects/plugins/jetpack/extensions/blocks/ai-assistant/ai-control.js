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
import Loading from './loading';
import ToneDropdownControl from './tone-dropdown-control';

const AIControl = ( {
	aiType,
	animationDone,
	contentIsLoaded,
	getSuggestionFromOpenAI,
	retryRequest,
	handleAcceptContent,
	handleAcceptTitle,
	handleTryAgain,
	handleGetSuggestion,
	isWaitingState,
	loadingImages,
	setAiType,
	userPrompt,
	setUserPrompt,
	showRetry,
	contentBefore,
	postTitle,
	wholeContent,
	content,
	promptType,
} ) => {
	const handleInputEnter = event => {
		if ( event.key === 'Enter' && ! event.shiftKey ) {
			event.preventDefault();
			handleGetSuggestion( 'userPrompt' );
		}
	};

	const toggleAIType = () => {
		if ( aiType === 'text' ) {
			setAiType( 'image' );
		} else {
			setAiType( 'text' );
		}
	};

	const textPlaceholder = ! content?.length
		? __( 'Ask AI to write anything…', 'jetpack' )
		: __( 'Tell AI what to do next…', 'jetpack', /* dummy arg to avoid bad minification */ 0 );

	let placeholder = '';

	if ( isWaitingState ) {
		if ( userPrompt?.length ) {
			placeholder = userPrompt;
		} else {
			placeholder = __( 'AI writing', 'jetpack' );
		}
	} else if ( aiType === 'text' ) {
		placeholder = textPlaceholder;
	} else {
		placeholder = __(
			'What would you like to see?',
			'jetpack',
			/* dummy arg to avoid bad minification */ 0
		);
	}

	return (
		<>
			{ ! isWaitingState && (
				<ToolbarControls
					aiType={ aiType }
					animationDone={ animationDone }
					contentIsLoaded={ contentIsLoaded }
					getSuggestionFromOpenAI={ getSuggestionFromOpenAI }
					retryRequest={ retryRequest }
					handleAcceptContent={ handleAcceptContent }
					handleAcceptTitle={ handleAcceptTitle }
					handleGetSuggestion={ handleGetSuggestion }
					handleTryAgain={ handleTryAgain }
					showRetry={ showRetry }
					toggleAIType={ toggleAIType }
					contentBefore={ contentBefore }
					hasPostTitle={ !! postTitle?.length }
					wholeContent={ wholeContent }
					promptType={ promptType }
				/>
			) }
			<div className="jetpack-ai-assistant__input-wrapper">
				{ ( isWaitingState || loadingImages ) && <Loading /> }
				<PlainText
					value={ isWaitingState ? '' : userPrompt }
					onChange={ value => setUserPrompt( value ) }
					onKeyPress={ handleInputEnter }
					placeholder={ placeholder }
					className="jetpack-ai-assistant__input"
					disabled={ isWaitingState || loadingImages }
				/>

				<div className="jetpack-ai-assistant__controls">
					<Button
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
	aiType,
	animationDone,
	contentIsLoaded,
	getSuggestionFromOpenAI,
	retryRequest,
	handleAcceptContent,
	handleAcceptTitle,
	handleTryAgain,
	showRetry,
	toggleAIType,
	contentBefore,
	hasPostTitle,
	wholeContent,
	promptType,
} ) => {
	return (
		<>
			{ ! showRetry && contentIsLoaded && animationDone && (
				<BlockControls group="block">
					<ToneDropdownControl
						value="neutral"
						onChange={ tone => getSuggestionFromOpenAI( 'change-tone', { tone } ) }
						disabled={ contentIsLoaded }
					/>
				</BlockControls>
			) }

			<BlockControls>
				{ aiType === 'text' && (
					// Text controls
					<ToolbarGroup>
						{ ! showRetry && contentIsLoaded && animationDone && (
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
							<ToolbarButton
								icon={ pencil }
								onClick={ () => getSuggestionFromOpenAI( 'continue' ) }
							>
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
						{ ! showRetry && ! contentIsLoaded && (
							<ToolbarDropdownMenu
								icon={ chevronDown }
								label="More"
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
				) }
				{ ! showRetry && ! contentIsLoaded && (
					// Image/text toggle
					<ToolbarGroup>
						{ aiType === 'text' && (
							<ToolbarButton icon={ image } onClick={ toggleAIType }>
								{ __( 'Ask AI for an image', 'jetpack' ) }
							</ToolbarButton>
						) }
						{ aiType === 'image' && (
							<ToolbarButton icon={ pencil } onClick={ toggleAIType }>
								{ __( 'Ask AI to write', 'jetpack' ) }
							</ToolbarButton>
						) }
					</ToolbarGroup>
				) }
			</BlockControls>
		</>
	);
};
