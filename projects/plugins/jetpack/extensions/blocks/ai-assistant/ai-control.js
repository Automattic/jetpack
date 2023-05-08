import {
	Button,
	Icon,
	MenuGroup,
	MenuItem,
	NavigableMenu,
	Popover,
	TextareaControl,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	arrowRight,
	check,
	image,
	pencil,
	postContent,
    postExcerpt,
	title,
	undo,
} from '@wordpress/icons';
import Loading from './loading';

const AIControl = ( {
	aiType,
	animationDone,
	content,
	contentIsLoaded,
	getSuggestionFromOpenAI,
	handleAcceptContent,
	handleGetSuggestion,
	isSelected,
	isWaitingState,
	loadingImages,
	placeholder,
	retry,
	setAiType,
	setUserPrompt,
	showRetry,
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

	const popoverContainer = useRef( null );
	return (
		<>
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
			<div ref={ popoverContainer } style={ { marginTop: '8px' } }>
				{ isSelected && ! isWaitingState && (
					<Popover flip={false} anchor={ popoverContainer.current } placement="bottom-start">
						<div className="components-dropdown">
							<NavigableMenu className="components-dropdown-menu__menu">
								{ ! showRetry && aiType === 'text' && contentIsLoaded && animationDone && (
									<MenuGroup>
										<MenuItem icon={ check } iconPosition="left" onClick={ handleAcceptContent }>
											{ __( 'Done', 'jetpack' ) }
										</MenuItem>
										<MenuItem
											icon={ pencil }
											iconPosition="left"
											onClick={ () => getSuggestionFromOpenAI( 'continue' ) }
										>
											{ __( 'Continue writing', 'jetpack' ) }
										</MenuItem>
									</MenuGroup>
								) }
								{ showRetry && (
									<MenuGroup>
										<MenuItem icon={ undo } iconPosition="left" onClick={ handleGetSuggestion }>
											{ __( 'Retry', 'jetpack' ) }
										</MenuItem>
									</MenuGroup>
								) }
								{ ! contentIsLoaded && aiType === 'text' && (
									<MenuGroup label={ __( 'Ask AI to write', 'jetpack' ) }>
										<MenuItem
											icon={ pencil }
											iconPosition="left"
											onClick={ () => getSuggestionFromOpenAI( 'continue' ) }
										>
											{ __( 'Continue writing', 'jetpack' ) }
										</MenuItem>
									</MenuGroup>
								) }
								{ ! contentIsLoaded && aiType === 'text' && (
									<MenuGroup label={ __( 'Ask AI to generate images', 'jetpack' ) }>
										<MenuItem icon={ image } iconPosition="left" onClick={ () => toggleAIType() }>
											{ __( 'Ask AI for an image', 'jetpack' ) }
										</MenuItem>
									</MenuGroup>
								) }
								{ ! contentIsLoaded && aiType === 'image' && (
									<MenuGroup label={ __( 'Ask AI to write', 'jetpack' ) }>
										<MenuItem icon={ pencil } iconPosition="left" onClick={ () => toggleAIType() }>
											{ __( 'Ask AI to write', 'jetpack' ) }
										</MenuItem>
									</MenuGroup>
								) }
								{ ! contentIsLoaded && aiType === 'text' && (
									<MenuGroup label={ __( 'Generate from content', 'jetpack' ) }>
										<MenuItem
											icon={ postExcerpt }
											iconPosition="left"
											onClick={ () => getSuggestionFromOpenAI( 'summarize' ) }
										>
											{ __( 'Summarize', 'jetpack' ) }
										</MenuItem>
										<MenuItem
											icon={ title }
											iconPosition="left"
											onClick={ () => getSuggestionFromOpenAI( 'titleSummary' ) }
										>
											{ __( 'Write a summary based on title', 'jetpack' ) }
										</MenuItem>
										<MenuItem
											icon={ postContent }
											iconPosition="left"
											onClick={ () => getSuggestionFromOpenAI( 'continue' ) }
										>
											{ __( 'Expand on preceding content', 'jetpack' ) }
										</MenuItem>
									</MenuGroup>
								) }
							</NavigableMenu>
						</div>
					</Popover>
				) }
			</div>
		</>
	);
};

export default AIControl;
