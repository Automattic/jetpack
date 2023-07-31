/**
 * External dependencies
 */
import { AiDataContext } from '@automattic/jetpack-ai-client';
import { PlainText, BlockPreview } from '@wordpress/block-editor';
import { rawHandler } from '@wordpress/blocks';
import { Icon, KeyboardShortcuts, Popover, Button } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { useRef, useEffect, useContext, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import { AiAssistantUiContext } from '../../extensions/ai-assistant/ui-context';
import aiAssistant from '../../icons/ai-assistant';
import origamiPlane from '../../icons/origami-plane';
// import { PROMPT_TYPE_CHANGE_LANGUAGE, PROMPT_TYPE_CHANGE_TONE } from '../../lib/prompt';
import { QuickActionsMenuItems } from '../ai-assistant-control';
// import { I18nMenuDropdown } from '../i18n-dropdown-control';
// import { ToneDropdownMenu } from '../tone-dropdown-control';
import { actionsList } from './contact-form-quick-actions';

type AiAssistantDialogProps = {
	value: string;

	onFocusLost?: () => void;
	onChange: ( value: string ) => void;
	onRequest: () => void;

	// Key press event handler
	onDialogTabPress: () => void;
};

const noop = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

/**
 * AiAssistantDialog react component
 *
 * @param {AiAssistantDialogProps} props - Component props
 * @returns {React.ReactElement} JSX component
 */
export default function AiAssistantDialog( props: AiAssistantDialogProps ): React.ReactElement {
	const { onFocusLost = noop, onChange, value, onRequest, onDialogTabPress } = props;

	// Hooks
	const inputRef = useRef( null );
	/*
	 * - Auto focus on the input field when the dialog is shown
	 * - Close the dialog when the input field loses focus
	 *   when onFocusLost is called
	 */
	useEffect( () => {
		if ( ! inputRef?.current ) {
			return;
		}

		const inputRefElement = inputRef.current;
		inputRefElement.focus();

		// Close when focus is lost
		const onCloseEventListner = inputRefElement.addEventListener( 'blur', onFocusLost );

		return () => {
			inputRefElement.removeEventListener( 'blur', onCloseEventListner );
		};
	}, [ onFocusLost ] );

	const { requestingState } = useContext( AiAssistantUiContext );

	// Send request when the user presses enter
	useKeyboardShortcut( [ 'command+enter', 'ctrl+enter' ], onRequest, {
		target: inputRef,
	} );

	return (
		<div className="jetpack-ai-assistant-dialog__wrapper">
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					tab: () => onDialogTabPress(),
				} }
			/>

			<PlainText
				value={ value }
				onChange={ onChange }
				placeholder={ __( 'AI writing', 'jetpack' ) }
				className="jetpack-ai-assistant-dialog__input"
				disabled={ false }
				ref={ inputRef }
			/>

			<Button
				className="jetpack-ai-assistant__prompt_button"
				onClick={ onRequest }
				isSmall={ true }
				label={ __( 'Send request', 'jetpack' ) }
				disabled={ ! value || requestingState === 'requesting' || requestingState === 'suggesting' }
			>
				<Icon icon={ origamiPlane } />
				{ __( 'Send', 'jetpack' ) }
			</Button>
		</div>
	);
}

type AiAssistantPopoverProps = {
	anchor: HTMLElement;
	show: boolean;
} & AiAssistantDialogProps;

export const AiAssistantPopover = ( {
	anchor,
	show,
	onRequest,
	onPromptChange,
	// onQuickAction,
	...rest
}: AiAssistantPopoverProps ) => {
	const { toggleAssistant, isAssistantMenuShown, hideAssistantMenu, showAssistantMenu } =
		useContext( AiAssistantUiContext );

	const { requestingState, suggestion } = useContext( AiDataContext );
	const [ message, setMessage ] = useState( '' );

	// useEffect( () => {
	// 	if ( ! generatedContent ) {
	// 		return;
	// 	}

	// 	const newContentBlocks = rawHandler( {
	// 		HTML: generatedContent,
	// 	} );
	// 	console.log( { newContentBlocks } );
	// }, [ generatedContent ] );

	if ( ! show ) {
		return null;
	}

	const filteredActions = actionsList.filter( action => {
		return message?.split( ' ' ).every( word => new RegExp( word, 'i' ).test( action.name ) );
	} );

	const forceHide = true;

	return (
		<Popover anchor={ anchor } className="jetpack-ai-assistant__popover">
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggleAssistant,
				} }
			>
				<div className="jetpack-ai-assistant-dialog__container">
					<div
						className={ classNames( 'ai-icon-wrapper', {
							[ `is-${ requestingState }` ]: true,
						} ) }
					>
						<Icon icon={ aiAssistant } size={ 24 } />
					</div>

					<AiAssistantDialog
						{ ...rest }
						onChange={ value => {
							setMessage( value );
							showAssistantMenu();
						} }
						onDialogTabPress={ console.log } // eslint-disable-line no-console
						value={ message }
						onRequest={ () => onRequest( message ) }
					/>
				</div>

				{ isAssistantMenuShown && ! forceHide && (
					<div className="jetpack-ai-assistant__menu">
						<QuickActionsMenuItems
							actions={ filteredActions }
							onChange={ action => {
								setPrompt( action.name );
								onPromptChange( action.promptType );
								hideAssistantMenu();
							} }
						/>

						{ /* <I18nMenuDropdown
							onChange={ language => {
								setPrompt( `Translate the text to ${ language }` );
								onPromptChange( PROMPT_TYPE_CHANGE_LANGUAGE, { language } );
								hideAssistantMenu();
							} }
						/>

						<ToneDropdownMenu
							onChange={ tone => {
								setPrompt( `Change the tone to ${ tone }` );
								onPromptChange( PROMPT_TYPE_CHANGE_TONE, { tone } );
								hideAssistantMenu();
							} }
						/> */ }
					</div>
				) }

				{ !! suggestion?.length && ! forceHide && (
					<div className="jetpack-ai-assistant__preview">
						<BlockPreview
							viewportWidth={ 0 }
							blocks={ rawHandler( {
								HTML: suggestion,
							} ) }
						/>
					</div>
				) }
			</KeyboardShortcuts>
		</Popover>
	);
};
