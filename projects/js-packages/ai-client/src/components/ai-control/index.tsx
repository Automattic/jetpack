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
type AIControlProps = {
	disabled?: boolean;
	value: string;
	placeholder?: string;
	showAccept?: boolean;
	acceptLabel?: string;
	showButtonLabels?: boolean;
	isTransparent?: boolean;
	state?: RequestingStateProp;
	showClearButton?: boolean;
	showGuideLine?: boolean;
	onChange?: ( newValue: string ) => void;
	onSend?: ( currentValue: string ) => void;
	onStop?: () => void;
	onAccept?: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
 * AI Control component.
 *
 * @param {AIControlProps} props       - Component props.
 * @param {React.MutableRefObject} ref - Ref to the component.
 * @returns {React.ReactElement}         Rendered component.
 */
export function AIControl(
	{
		disabled = false,
		value = '',
		placeholder = '',
		showAccept = false,
		acceptLabel = __( 'Accept', 'jetpack-ai-client' ),
		showButtonLabels = true,
		isTransparent = false,
		state = 'init',
		showClearButton = true,
		showGuideLine = false,
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
		showButtonLabels?: boolean;
		isTransparent?: boolean;
		state?: RequestingStateProp;
		showClearButton?: boolean;
		showGuideLine?: boolean;
		onChange?: ( newValue: string ) => void;
		onSend?: ( currentValue: string ) => void;
		onStop?: () => void;
		onAccept?: () => void;
	},
	ref: React.MutableRefObject< null > // eslint-disable-line @typescript-eslint/ban-types
): React.ReactElement {
	const promptUserInputRef = useRef( null );
	const loading = state === 'requesting' || state === 'suggesting';

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
		'has-label': showButtonLabels,
	} );

	return (
		<div className="jetpack-components-ai-control__container">
			<div
				className={ classNames( 'jetpack-components-ai-control__wrapper', {
					'is-transparent': isTransparent,
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

				{ value?.length > 0 && showClearButton && (
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
							onClick={ () => onSend?.( value ) }
							isSmall={ true }
							disabled={ ! value?.length || disabled }
							label={ __( 'Send request', 'jetpack-ai-client' ) }
						>
							<Icon icon={ arrowUp } />
							{ showButtonLabels && __( 'Send', 'jetpack-ai-client' ) }
						</Button>
					) : (
						<Button
							className={ actionButtonClasses }
							onClick={ onStop }
							isSmall={ true }
							label={ __( 'Stop request', 'jetpack-ai-client' ) }
						>
							<Icon icon={ closeSmall } />
							{ showButtonLabels && __( 'Stop (ESC)', 'jetpack-ai-client' ) }
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
							{ showButtonLabels && acceptLabel }
						</Button>
					</div>
				) }
			</div>
			{ showGuideLine && <GuidelineMessage /> }
		</div>
	);
}

export default forwardRef( AIControl );
