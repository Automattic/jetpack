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
import { forwardRef, useImperativeHandle, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { image, pencil, update, closeSmall, check } from '@wordpress/icons';
/*
 * Internal dependencies
 */
import classNames from 'classnames';
import ConnectPrompt from './components/connect-prompt';
import I18nDropdownControl from './components/i18n-dropdown-control';
import PromptTemplatesControl from './components/prompt-templates-control';
import ToneDropdownControl from './components/tone-dropdown-control';
import useAIFeature from './hooks/use-ai-feature';
import AIAssistantIcon from './icons/ai-assistant';
import origamiPlane from './icons/origami-plane';
import { isUserConnected } from './lib/connection';
import UpgradePrompt from './upgrade-prompt';

const AIControl = forwardRef(
	(
		{
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
			requireUpgrade,
			recordEvent,
			isGeneratingTitle,
		},
		ref
	) => {
		const promptUserInputRef = useRef( null );
		const [ isSm ] = useBreakpointMatch( 'sm' );

		const handleInputEnter = event => {
			if ( event.key === 'Enter' && ! event.shiftKey ) {
				event.preventDefault();
				handleGetSuggestion( 'userPrompt' );
			}
		};

		const connected = isUserConnected();
		const { requireUpgrade: siteRequireUpgrade } = useAIFeature();

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

		useImperativeHandle(
			ref,
			() => ( {
				// Focus the text area
				focus: () => {
					const userPromptInput = promptUserInputRef?.current;
					userPromptInput?.focus?.();
				},
			} ),
			[]
		);

		return (
			<>
				{ ( siteRequireUpgrade || requireUpgrade ) && <UpgradePrompt /> }
				{ ! connected && <ConnectPrompt /> }
				{ ! isWaitingState && connected && (
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
						recordEvent={ recordEvent }
						isGeneratingTitle={ isGeneratingTitle }
					/>
				) }
				<div
					className={ classNames( 'jetpack-ai-assistant__input-wrapper', {
						'is-disconnected': ! connected,
					} ) }
				>
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
						disabled={
							isWaitingState || loadingImages || ! connected || siteRequireUpgrade || requireUpgrade
						}
						ref={ promptUserInputRef }
					/>

					<div className="jetpack-ai-assistant__controls">
						{ ! isWaitingState ? (
							<Button
								className="jetpack-ai-assistant__prompt_button"
								onClick={ () => handleGetSuggestion( 'userPrompt' ) }
								isSmall={ true }
								disabled={
									! userPrompt?.length || ! connected || siteRequireUpgrade || requireUpgrade
								}
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

						{ contentIsLoaded &&
							! isWaitingState &&
							( promptType === 'generateTitle' ? (
								<Button
									className="jetpack-ai-assistant__prompt_button"
									onClick={ handleAcceptTitle }
									isSmall={ true }
									label={ __( 'Accept title', 'jetpack' ) }
								>
									<Icon icon={ check } />
									{ __( 'Accept title', 'jetpack' ) }
								</Button>
							) : (
								<Button
									className="jetpack-ai-assistant__prompt_button"
									onClick={ handleAcceptContent }
									isSmall={ true }
									label={ __( 'Accept', 'jetpack' ) }
								>
									<Icon icon={ check } />
									{ __( 'Accept', 'jetpack' ) }
								</Button>
							) ) }
					</div>
				</div>
			</>
		);
	}
);

export default AIControl;

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
							<ToneDropdownControl
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
