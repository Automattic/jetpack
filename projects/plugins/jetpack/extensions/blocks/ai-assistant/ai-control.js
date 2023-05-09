import { BlockControls } from '@wordpress/block-editor';
import {
	Button,
	Icon,
	TextareaControl,
	ToolbarButton,
	ToolbarDropdownMenu,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { arrowRight, check, image, pencil, update, title, undo } from '@wordpress/icons';
import Loading from './loading';

const AIControl = ( {
	aiType,
	animationDone,
	content,
	contentIsLoaded,
	getSuggestionFromOpenAI,
	handleAcceptContent,
	handleTryAgain,
	handleGetSuggestion,
	isWaitingState,
	loadingImages,
	placeholder,
	setAiType,
	setUserPrompt,
	showRetry,
	contentBefore,
	postTitle,
} ) => {
	const handleInputEnter = event => {
		if ( event.key === 'Enter' && ! event.shiftKey ) {
			event.preventDefault();
			handleGetSuggestion();
		}
	};

	const toggleAIType = () => {
		if ( aiType === 'text' ) {
			setAiType( 'image' );
		} else {
			setAiType( 'text' );
		}
	};

	return (
		<>
			{ ! isWaitingState && (
				<ToolbarControls
					aiType={ aiType }
					animationDone={ animationDone }
					contentIsLoaded={ contentIsLoaded }
					getSuggestionFromOpenAI={ getSuggestionFromOpenAI }
					handleAcceptContent={ handleAcceptContent }
					handleGetSuggestion={ handleGetSuggestion }
					handleTryAgain={ handleTryAgain }
					showRetry={ showRetry }
					toggleAIType={ toggleAIType }
					contentBefore={ contentBefore }
					hasPostTitle={ postTitle?.length }
				/>
			) }
			<div className="jetpack-ai-assistant__input-wrapper">
				{ ( ( ! content && isWaitingState ) || loadingImages ) && <Loading /> }
				<TextareaControl
					onChange={ value => setUserPrompt( value ) }
					onKeyPress={ handleInputEnter }
					rows="1"
					placeholder={ isWaitingState ? __( 'AI writing', 'jetpack' ) : placeholder }
					className="jetpack-ai-assistant__input"
				/>
				<div className="jetpack-ai-assistant__controls">
					<Button
						onClick={ () => handleGetSuggestion() }
						isSmall={ true }
						disabled={ isWaitingState }
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
	handleAcceptContent,
	handleTryAgain,
	handleGetSuggestion,
	showRetry,
	toggleAIType,
	contentBefore,
	hasPostTitle,
} ) => {
	return (
		<BlockControls>
			{ aiType === 'text' && (
				// Text controls
				<ToolbarGroup>
					{ ! showRetry && contentIsLoaded && animationDone && (
						<>
							<ToolbarButton icon={ check } onClick={ handleAcceptContent }>
								{ __( 'Done', 'jetpack' ) }
							</ToolbarButton>
							<ToolbarButton icon={ undo } onClick={ handleTryAgain }>
								{ __( 'Try Again', 'jetpack' ) }
							</ToolbarButton>
						</>
					) }

					{ ! showRetry && ! contentIsLoaded && contentBefore?.length && (
						<ToolbarButton icon={ pencil } onClick={ () => getSuggestionFromOpenAI( 'continue' ) }>
							{ __( 'Continue writing', 'jetpack' ) }
						</ToolbarButton>
					) }

					{ ! showRetry && ! contentIsLoaded && ! contentBefore?.length && (
						<ToolbarButton
							icon={ title }
							onClick={ () => getSuggestionFromOpenAI( 'titleSummary' ) }
						>
							{ __( 'Write a summary based on title', 'jetpack' ) }
						</ToolbarButton>
					) }

					{ ! showRetry && ! contentIsLoaded && (
						<ToolbarDropdownMenu
							label="More"
							controls={ [
								{
									title: __( 'Summarize', 'jetpack' ),
									onClick: () => getSuggestionFromOpenAI( 'summarize' ),
								},
								{
									title: __( 'Write a summary based on title', 'jetpack' ),
									onClick: () => getSuggestionFromOpenAI( 'titleSummary' ),
									isDisabled: ! hasPostTitle,
								},
								{
									title: __( 'Expand on preceding content', 'jetpack' ),
									onClick: () => getSuggestionFromOpenAI( 'continue' ),
								},
							] }
						/>
					) }
					{ showRetry && (
						<ToolbarButton icon={ update } onClick={ handleGetSuggestion }>
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
	);
};
