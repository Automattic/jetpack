/**
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { useBreakpointMatch } from '@automattic/jetpack-components';
import { PlainText } from '@wordpress/block-editor';
import { Button, Icon, Spinner } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { forwardRef, useImperativeHandle, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall, check, arrowUp } from '@wordpress/icons';
/*
 * Internal dependencies
 */
import classNames from 'classnames';
import { isUserConnected } from '../../lib/connection';
import ConnectPrompt from '../connect-prompt';
import Message, { ASSISTANT_STATE_CONTENT_GENERATED } from '../message/block-message';
import ToolbarControls from '../toolbar-controls';
import UpgradePrompt from '../upgrade-prompt';

const isInBlockEditor = window?.Jetpack_Editor_Initial_State?.screenBase === 'post';

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

		const connected = isUserConnected();

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

		useKeyboardShortcut(
			[ 'command+enter', 'ctrl+enter' ],
			() => {
				if ( contentIsLoaded ) {
					if ( promptType === 'generateTitle' ) {
						handleAcceptTitle();
					} else {
						handleAcceptContent();
					}
				}
			},
			{
				target: promptUserInputRef,
			}
		);

		useKeyboardShortcut(
			'enter',
			() => {
				handleGetSuggestion( 'userPrompt' );
			},
			{
				target: promptUserInputRef,
			}
		);

		return (
			<>
				{ requireUpgrade && <UpgradePrompt /> }
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
				<div className="jetpack-ai-assistant__input-container">
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
									icon={ aiAssistantIcon }
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
							placeholder={ placeholder }
							className="jetpack-ai-assistant__input"
							disabled={ isWaitingState || loadingImages || ! connected || requireUpgrade }
							ref={ promptUserInputRef }
						/>

						<div className="jetpack-ai-assistant__controls">
							<div className="jetpack-ai-assistant__prompt_button_wrapper">
								{ ! isWaitingState ? (
									<Button
										className="jetpack-ai-assistant__prompt_button"
										onClick={ () => handleGetSuggestion( 'userPrompt' ) }
										isSmall={ true }
										disabled={ ! userPrompt?.length || ! connected || requireUpgrade }
										label={ __( 'Send request', 'jetpack' ) }
									>
										<Icon icon={ arrowUp } />
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

							<div className="jetpack-ai-assistant__prompt_button_wrapper">
								{ contentIsLoaded &&
									! isWaitingState &&
									( isInBlockEditor && promptType === 'generateTitle' ? (
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
					</div>
					{ contentIsLoaded && ! isWaitingState && (
						<Message state={ ASSISTANT_STATE_CONTENT_GENERATED } />
					) }
				</div>
			</>
		);
	}
);

export default AIControl;
