/**
 * External dependencies
 */
import { PlainText, BlockPreview } from '@wordpress/block-editor';
import { rawHandler } from '@wordpress/blocks';
import { KeyboardShortcuts, Popover } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { useRef, useEffect, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MarkdownIt from 'markdown-it';
import React from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import { AiAssistantContext } from '../../extensions/ai-assistant/context';
import { PROMPT_TYPE_CHANGE_LANGUAGE, PROMPT_TYPE_CHANGE_TONE } from '../../lib/prompt';
import { QuickActionsMenuItems, quickActionsList } from '../ai-assistant-control';
import { I18nMenuDropdown } from '../i18n-dropdown-control';
import { ToneDropdownMenu } from '../tone-dropdown-control';

const markdownConverter = new MarkdownIt( {
	breaks: true,
} );

type AiAssistantDialogProps = {
	promptValue: string;

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
	const { onFocusLost = noop, onChange, promptValue, onRequest, onDialogTabPress } = props;

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

	// Send request when the user presses enter
	useKeyboardShortcut( [ 'command+enter', 'ctrl+enter' ], onRequest, {
		target: inputRef,
	} );

	return (
		<div className="jetpack-ai-assistant__input-container">
			<div className="jetpack-ai-assistant__input-wrapper">
				<KeyboardShortcuts
					bindGlobal
					shortcuts={ {
						tab: () => onDialogTabPress(),
					} }
				>
					<PlainText
						value={ promptValue }
						onChange={ onChange }
						placeholder={ __( 'AI writing', 'jetpack' ) }
						className="jetpack-ai-assistant__input"
						disabled={ false }
						ref={ inputRef }
					/>
				</KeyboardShortcuts>
			</div>
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
	onPromptChange,
	onQuickAction,
	...rest
}: AiAssistantPopoverProps ) => {
	const {
		toggleAssistant,
		promptValue,
		setPromptValue,
		isAssistantMenuShown,
		hideAssistantMenu,
		showAssistantMenu,
		generatedContent,
	} = useContext( AiAssistantContext );

	useEffect( () => {
		if ( ! generatedContent ) {
			return;
		}

		const newContentBlocks = rawHandler( {
			HTML: generatedContent,
		} );
		console.log( { newContentBlocks } );
	}, [ generatedContent ] );

	if ( ! show ) {
		return null;
	}

	const filteredActions = quickActionsList.filter( action => {
		return promptValue?.split( ' ' ).every( word => new RegExp( word, 'i' ).test( action.name ) );
	} );

	return (
		<Popover anchor={ anchor }>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggleAssistant,
				} }
			>
				<AiAssistantDialog
					onChange={ value => {
						setPromptValue( value );
						showAssistantMenu();
					} }
					onDialogTabPress={ console.log }
					{ ...rest }
				/>

				{ isAssistantMenuShown && (
					<div className="jetpack-ai-assistant__menu">
						<QuickActionsMenuItems
							actions={ filteredActions }
							onChange={ action => {
								setPromptValue( action.name );
								onPromptChange( action.promptType );
								hideAssistantMenu();
							} }
						/>

						<I18nMenuDropdown
							onChange={ language => {
								setPromptValue( `Translate the text to ${ language }` );
								onPromptChange( PROMPT_TYPE_CHANGE_LANGUAGE, { language } );
								hideAssistantMenu();
							} }
						/>

						<ToneDropdownMenu
							onChange={ tone => {
								setPromptValue( `Change the tone to ${ tone }` );
								onPromptChange( PROMPT_TYPE_CHANGE_TONE, { tone } );
								hideAssistantMenu();
							} }
						/>
					</div>
				) }

				{ !! generatedContent?.length && (
					<div className="jetpack-ai-assistant__preview">
						<BlockPreview
							viewportWidth={ 0 }
							blocks={ rawHandler( {
								HTML: generatedContent,
							} ) }
						/>
					</div>
				) }
			</KeyboardShortcuts>
		</Popover>
	);
};
