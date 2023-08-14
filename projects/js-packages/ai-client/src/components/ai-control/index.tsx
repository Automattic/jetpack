/**
 * External dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { forwardRef, useImperativeHandle, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall, check, arrowUp } from '@wordpress/icons';
import classNames from 'classnames';
import React from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import AiStatusIndicator from '../ai-status-indicator';
import { GuidelineMessage } from './message';
/**
 * Types
 */
import type { RequestingStateProp } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
 * AI Control component.
 *
 * @param {object} props - component props
 * @param {boolean} props.disabled - is disabled
 * @param {string} props.value - input value
 * @param {string} props.placeholder - input placeholder
 * @param {boolean} props.showAccept - show accept button
 * @param {string} props.acceptLabel - accept button label
 * @param {boolean} props.showButtonsLabel - show buttons label
 * @param {boolean} props.isOpaque - is opaque
 * @param {string} props.state - requesting state
 * @param {Function} props.onChange - input change handler
 * @param {Function} props.onSend - send request handler
 * @param {Function} props.onStop - stop request handler
 * @param {Function} props.onAccept - accept handler
 * @param {object} ref - Auto injected ref from react
 * @returns {object} - AI Control component
 */
export function AIControl(
	{
		disabled = false,
		value = '',
		placeholder = '',
		showAccept = false,
		acceptLabel = __( 'Accept', 'jetpack-ai-client' ),
		showButtonsLabel = true,
		isOpaque = false,
		state = 'init',
		onChange = noop,
		onSend = noop,
		onStop = noop,
		onAccept = noop,
	}: {
		disabled?: boolean;
		value: string;
		placeholder?: string;
		showAccept?: boolean;
		acceptLabel?: string;
		showButtonsLabel?: boolean;
		isOpaque?: boolean;
		state?: RequestingStateProp;
		onChange?: ( newValue: string ) => void;
		onSend?: ( currentValue: string ) => void;
		onStop?: () => void;
		onAccept?: () => void;
	},
	ref
) {
	const promptUserInputRef = useRef( null );
	const loading = state === 'requesting' || state === 'suggesting';
	const showGuideLine = ! ( loading || disabled || value?.length || isOpaque );

	// Pass the ref to forwardRef.
	useImperativeHandle( ref, () => promptUserInputRef.current );

	useKeyboardShortcut(
		'mod+enter',
		() => {
			if ( showAccept ) {
				onAccept?.();
			}
		},
		{
			target: promptUserInputRef,
		}
	);

	useKeyboardShortcut(
		'enter',
		e => {
			e.preventDefault();
			onSend?.( value );
		},
		{
			target: promptUserInputRef,
		}
	);

	const actionButtonClasses = classNames( 'jetpack-components-ai-control__controls-prompt_button', {
		'has-label': showButtonsLabel,
	} );

	return (
		<div className="jetpack-components-ai-control__container">
			<div
				className={ classNames( 'jetpack-components-ai-control__wrapper', {
					'is-opaque': isOpaque,
				} ) }
			>
				<AiStatusIndicator state={ state } />

				<div className="jetpack-components-ai-control__input-wrapper">
					<PlainText
						value={ value }
						onChange={ onChange }
						placeholder={ placeholder }
						className="jetpack-components-ai-control__input"
						disabled={ loading || disabled }
						ref={ promptUserInputRef }
					/>
				</div>

				{ value?.length > 0 && (
					<Button
						icon={ closeSmall }
						className="jetpack-components-ai-control__clear"
						onClick={ () => onChange( '' ) }
					/>
				) }

				<div className="jetpack-components-ai-control__controls-prompt_button_wrapper">
					{ ! loading ? (
						<Button
							className={ actionButtonClasses }
							onClick={ () => onSend( value ) }
							isSmall={ true }
							disabled={ ! value?.length || disabled }
							label={ __( 'Send request', 'jetpack-ai-client' ) }
						>
							<Icon icon={ arrowUp } />
							{ showButtonsLabel && __( 'Send', 'jetpack-ai-client' ) }
						</Button>
					) : (
						<Button
							className={ actionButtonClasses }
							onClick={ onStop }
							isSmall={ true }
							label={ __( 'Stop request', 'jetpack-ai-client' ) }
						>
							<Icon icon={ closeSmall } />
							{ showButtonsLabel && __( 'Stop', 'jetpack-ai-client' ) }
						</Button>
					) }
				</div>

				{ showAccept && (
					<div className="jetpack-components-ai-control__controls-prompt_button_wrapper">
						<Button
							className={ actionButtonClasses }
							onClick={ onAccept }
							isSmall={ true }
							label={ acceptLabel }
						>
							<Icon icon={ check } />
							{ showButtonsLabel && acceptLabel }
						</Button>
					</div>
				) }
			</div>
			{ showGuideLine && <GuidelineMessage /> }
		</div>
	);
}

export default forwardRef( AIControl );
