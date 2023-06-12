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
import { Text, View } from 'react-native';
/*
 * Internal dependencies
 */
import I18nDropdownControl from './i18n-dropdown-control.native';
import Loading from './loading';
import ToneDropdownControl from './tone-dropdown-control.native';

const AIControl = ( {
	aiType,
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
	onChange,
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
					isWaitingState={ isWaitingState }
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
			<View className="jetpack-ai-assistant__input-wrapper">
				{ ( isWaitingState || loadingImages ) && <Loading /> }
				<PlainText
					value={ isWaitingState ? '' : userPrompt }
					onChange={ value => {
						setUserPrompt( value );
						onChange?.();
					} }
					onKeyPress={ handleInputEnter }
					placeholder={ placeholder }
					className="jetpack-ai-assistant__input"
					style={{color: 'white'}}
					placeholderTextColor='#777'
					disabled={ isWaitingState || loadingImages }
				/>

				<View className="jetpack-ai-assistant__controls">
					<Button
						onClick={ () => handleGetSuggestion( 'userPrompt' ) }
						isSmall={ true }
						disabled={ isWaitingState || ! userPrompt?.length }
						label={ __( 'Do some magic!', 'jetpack' ) }
					>
						<Icon icon={ arrowRight } />
					</Button>
				</View>
			</View>
		</>
	);
};

export default AIControl;

const ToolbarControls = ( {
	aiType,
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
			{ contentIsLoaded && (
				<BlockControls group="block">

			<Text style={{color: 'white'}}>Bisect 1</Text>
					{/* <ToneDropdownControl
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
						label="More"
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
							{
								title: __( 'Generate a post title', 'jetpack' ),
								onClick: () =>
									getSuggestionFromOpenAI( 'generateTitle', { contentType: 'generated' } ),
							},
						] }
					/> */}
				</BlockControls>
			) }

			<BlockControls>
				{ aiType === 'text' && (
			<Text style={{color: 'white'}}>Bisect 2</Text>
					// // Text controls
					// <ToolbarGroup>
					// 	{ ! showRetry && contentIsLoaded && (
					// 		<>
					// 			{ promptType === 'generateTitle' ? (
					// 				<ToolbarButton onClick={ handleAcceptTitle }>
					// 					{ __( 'Accept title', 'jetpack' ) }
					// 				</ToolbarButton>
					// 			) : (
					// 				<ToolbarButton onClick={ handleAcceptContent }>
					// 					{ __( 'Done', 'jetpack' ) }
					// 				</ToolbarButton>
					// 			) }
					// 			<ToolbarButton onClick={ handleTryAgain }>
					// 				{ __( 'Try Again', 'jetpack' ) }
					// 			</ToolbarButton>
					// 		</>
					// 	) }

					// 	{ !! ( ! showRetry && ! contentIsLoaded && contentBefore?.length ) && (
					// 		<ToolbarButton
					// 			icon={ pencil }
					// 			onClick={ () => getSuggestionFromOpenAI( 'continue' ) }
					// 		>
					// 			{ __( 'Continue writing', 'jetpack' ) }
					// 		</ToolbarButton>
					// 	) }

					// 	{ ! showRetry && ! contentIsLoaded && ! contentBefore?.length && hasPostTitle && (
					// 		<ToolbarButton
					// 			icon={ title }
					// 			onClick={ () => getSuggestionFromOpenAI( 'titleSummary' ) }
					// 		>
					// 			{ __( 'Write a summary based on title', 'jetpack' ) }
					// 		</ToolbarButton>
					// 	) }

					// 	{ ! showRetry && ! contentIsLoaded && !! wholeContent?.length && (
					// 		<I18nDropdownControl
					// 			value="en"
					// 			label={ __( 'Translate', 'jetpack' ) }
					// 			onChange={ language => getSuggestionFromOpenAI( 'changeLanguage', { language } ) }
					// 		/>
					// 	) }

					// 	{ ! showRetry && ! contentIsLoaded && (
					// 		<ToolbarDropdownMenu
					// 			icon={ chevronDown }
					// 			label="More"
					// 			controls={ [
					// 				{
					// 					title: __( 'Summarize', 'jetpack' ),
					// 					onClick: () => getSuggestionFromOpenAI( 'summarize' ),
					// 					isDisabled: ! wholeContent?.length,
					// 				},
					// 				{
					// 					title: __( 'Write a summary based on title', 'jetpack' ),
					// 					onClick: () => getSuggestionFromOpenAI( 'titleSummary' ),
					// 					isDisabled: ! hasPostTitle,
					// 				},
					// 				{
					// 					title: __( 'Expand on preceding content', 'jetpack' ),
					// 					onClick: () => getSuggestionFromOpenAI( 'continue' ),
					// 					isDisabled: ! contentBefore?.length,
					// 				},
					// 				{
					// 					title: __( 'Correct spelling and grammar of preceding content', 'jetpack' ),
					// 					onClick: () => getSuggestionFromOpenAI( 'correctSpelling' ),
					// 					isDisabled: ! contentBefore?.length,
					// 				},
					// 				{
					// 					title: __( 'Simplify preceding content', 'jetpack' ),
					// 					onClick: () => getSuggestionFromOpenAI( 'simplify' ),
					// 					isDisabled: ! contentBefore?.length,
					// 				},
					// 				{
					// 					title: __( 'Generate a post title', 'jetpack' ),
					// 					onClick: () => getSuggestionFromOpenAI( 'generateTitle' ),
					// 					isDisabled: ! wholeContent?.length,
					// 				},
					// 			] }
					// 		/>
					// 	) }
					// 	{ showRetry && (
					// 		<ToolbarButton icon={ update } onClick={ retryRequest }>
					// 			{ __( 'Retry', 'jetpack' ) }
					// 		</ToolbarButton>
					// 	) }
					// </ToolbarGroup>
				) }
				{ ! showRetry && ! contentIsLoaded && (
			// <Text style={{color: 'white'}}>Bisect 3</Text>
					// Image/text toggle
					<View>

					{/* <ToolbarGroup> */}
						{ aiType === 'text' && (
			 <Text style={{color: 'white'}}>{ __( 'Ask AI for an image', 'jetpack' ) }</Text>
							// <Button icon={ image } onClick={ toggleAIType }>
							// 	{ __( 'Ask AI for an image', 'jetpack' ) }
							// </Button>
						) }
						{ aiType === 'image' && (
			 <Text style={{color: 'white'}}>{ __( 'Ask AI to write', 'jetpack' ) }</Text>
							// <Button icon={ pencil } onClick={ toggleAIType }>
							// 	{ __( 'Ask AI to write', 'jetpack' ) }
							// </Button>
						) }
					{/* </ToolbarGroup> */}
					</View>
				) }
			</BlockControls>
		</>
	);
};