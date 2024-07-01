/**
 * External dependencies
 */
import { Button, ButtonGroup } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { useImperativeHandle, useRef, useEffect, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall, arrowUp, undo } from '@wordpress/icons';
import React, { forwardRef } from 'react';
/**
 * Internal dependencies
 */
import { GuidelineMessage, ErrorMessage, UpgradeMessage } from '../message/index.js';
import AIControl from './ai-control.js';
import './style.scss';
/**
 * Types
 */
import type { RequestingErrorProps, RequestingStateProp } from '../../types.js';
import type { ReactElement, MouseEvent } from 'react';

type ExtensionAIControlProps = {
	className?: string;
	disabled?: boolean;
	value: string;
	placeholder?: string;
	showButtonLabels?: boolean;
	isTransparent?: boolean;
	state?: RequestingStateProp;
	showGuideLine?: boolean;
	error?: RequestingErrorProps;
	requestsRemaining?: number;
	showUpgradeMessage?: boolean;
	upgradeUrl?: string;
	wrapperRef?: React.MutableRefObject< HTMLDivElement | null >;
	onChange?: ( newValue: string ) => void;
	onSend?: ( currentValue: string ) => void;
	onStop?: () => void;
	onClose?: () => void;
	onUndo?: () => void;
	onUpgrade?: ( event: MouseEvent< HTMLButtonElement > ) => void;
	onTryAgain?: () => void;
};

/**
 * ExtensionAIControl component. Used by the AI Assistant inline extensions, adding logic and components to the base AIControl component.
 *
 * @param {ExtensionAIControlProps} props  - Component props
 * @param {React.MutableRefObject} ref     - Ref to the component
 * @returns {ReactElement}                 Rendered component
 */
export function ExtensionAIControl(
	{
		className,
		disabled = false,
		value = '',
		placeholder = '',
		showButtonLabels = true,
		isTransparent = false,
		state = 'init',
		showGuideLine = false,
		error,
		requestsRemaining,
		showUpgradeMessage = false,
		upgradeUrl,
		wrapperRef,
		onChange,
		onSend,
		onStop,
		onClose,
		onUndo,
		onUpgrade,
		onTryAgain,
	}: ExtensionAIControlProps,
	ref: React.MutableRefObject< HTMLInputElement >
): ReactElement {
	const loading = state === 'requesting' || state === 'suggesting';
	const [ editRequest, setEditRequest ] = useState( false );
	const [ lastValue, setLastValue ] = useState( value || null );
	const promptUserInputRef = useRef( null );

	// Pass the ref to forwardRef.
	useImperativeHandle( ref, () => promptUserInputRef.current );

	useEffect( () => {
		if ( editRequest ) {
			promptUserInputRef?.current?.focus();
		}
	}, [ editRequest ] );

	const sendHandler = useCallback( () => {
		setLastValue( value );
		setEditRequest( false );
		onSend?.( value );
	}, [ onSend, value ] );

	const changeHandler = useCallback(
		( newValue: string ) => {
			onChange?.( newValue );
			if ( state === 'init' ) {
				return;
			}

			if ( ! lastValue ) {
				// here we're coming from a one-click action
				setEditRequest( newValue.length > 0 );
			} else {
				// here we're coming from an edit action
				setEditRequest( newValue !== lastValue );
			}
		},
		[ onChange, lastValue, state ]
	);

	const stopHandler = useCallback( () => {
		onStop?.();
	}, [ onStop ] );

	const closeHandler = useCallback( () => {
		onClose?.();
	}, [ onClose ] );

	const undoHandler = useCallback( () => {
		onUndo?.();
	}, [ onUndo ] );

	const upgradeHandler = useCallback(
		( event: MouseEvent< HTMLButtonElement > ) => {
			onUpgrade?.( event );
		},
		[ onUpgrade ]
	);

	const tryAgainHandler = useCallback( () => {
		onTryAgain?.();
	}, [ onTryAgain ] );

	useKeyboardShortcut(
		'enter',
		e => {
			e.preventDefault();
			sendHandler();
		},
		{
			target: promptUserInputRef,
		}
	);

	const actions = (
		<>
			{ loading ? (
				<Button
					className="jetpack-components-ai-control__controls-prompt_button"
					onClick={ stopHandler }
					variant="secondary"
					label={ __( 'Stop request', 'jetpack-ai-client' ) }
				>
					{ showButtonLabels ? __( 'Stop', 'jetpack-ai-client' ) : <Icon icon={ closeSmall } /> }
				</Button>
			) : (
				<>
					{ value?.length > 0 && (
						<div className="jetpack-components-ai-control__controls-prompt_button_wrapper">
							<Button
								className="jetpack-components-ai-control__controls-prompt_button"
								onClick={ sendHandler }
								variant="primary"
								disabled={ ! value?.length || disabled }
								label={ __( 'Send request', 'jetpack-ai-client' ) }
							>
								{ showButtonLabels ? (
									__( 'Generate', 'jetpack-ai-client' )
								) : (
									<Icon icon={ arrowUp } />
								) }
							</Button>
						</div>
					) }
					{ value?.length <= 0 && state === 'done' && (
						<div className="jetpack-components-ai-control__controls-prompt_button_wrapper">
							<ButtonGroup>
								<Button
									className="jetpack-components-ai-control__controls-prompt_button"
									label={ __( 'Undo', 'jetpack-ai-client' ) }
									onClick={ undoHandler }
									tooltipPosition="top"
								>
									<Icon icon={ undo } />
								</Button>
								<Button
									className="jetpack-components-ai-control__controls-prompt_button"
									label={ __( 'Close', 'jetpack-ai-client' ) }
									onClick={ closeHandler }
									variant="tertiary"
								>
									{ __( 'Close', 'jetpack-ai-client' ) }
								</Button>
							</ButtonGroup>
						</div>
					) }
				</>
			) }
		</>
	);

	let message = null;

	if ( error?.message ) {
		message = (
			<ErrorMessage
				error={ error.message }
				code={ error.code }
				onTryAgainClick={ tryAgainHandler }
				onUpgradeClick={ upgradeHandler }
				upgradeUrl={ upgradeUrl }
			/>
		);
	} else if ( showUpgradeMessage ) {
		message = (
			<UpgradeMessage
				requestsRemaining={ requestsRemaining }
				onUpgradeClick={ upgradeHandler }
				upgradeUrl={ upgradeUrl }
			/>
		);
	} else if ( showGuideLine ) {
		message = <GuidelineMessage />;
	}

	return (
		<AIControl
			className={ className }
			disabled={ disabled || loading }
			value={ value }
			placeholder={ placeholder }
			isTransparent={ isTransparent }
			state={ state }
			onChange={ changeHandler }
			actions={ actions }
			message={ message }
			promptUserInputRef={ promptUserInputRef }
			wrapperRef={ wrapperRef }
		/>
	);
}

export default forwardRef( ExtensionAIControl );
