/**
 * External dependencies
 */
import { Button, ButtonGroup } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { useImperativeHandle, useRef, useEffect, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	closeSmall,
	check,
	arrowUp,
	trash,
	reusableBlock as regenerate,
} from '@wordpress/icons';
import debugFactory from 'debug';
import React, { forwardRef } from 'react';
/**
 * Internal dependencies
 */
import { GuidelineMessage } from '../message/index.js';
import AIControl from './ai-control.js';
import './style.scss';
/**
 * Types
 */
import type { RequestingStateProp } from '../../types.js';
import type { ReactElement } from 'react';

type BlockAIControlProps = {
	disabled?: boolean;
	value: string;
	placeholder?: string;
	showAccept?: boolean;
	acceptLabel?: string;
	showButtonLabels?: boolean;
	isTransparent?: boolean;
	state?: RequestingStateProp;
	showGuideLine?: boolean;
	customFooter?: ReactElement;
	onChange?: ( newValue: string ) => void;
	onSend?: ( currentValue: string ) => void;
	onStop?: () => void;
	onAccept?: () => void;
	onDiscard?: () => void;
	showRemove?: boolean;
	banner?: ReactElement;
	error?: ReactElement;
};

const debug = debugFactory( 'jetpack-ai-client:block-ai-control' );

/**
 * BlockAIControl component. Used by the AI Assistant block, adding logic and components to the base AIControl component.
 *
 * @param {BlockAIControlProps} props  - Component props
 * @param {React.MutableRefObject} ref - Ref to the component
 * @returns {ReactElement}             Rendered component
 */
export function BlockAIControl(
	{
		disabled = false,
		value = '',
		placeholder = '',
		showAccept = false,
		acceptLabel = __( 'Accept', 'jetpack-ai-client' ),
		showButtonLabels = true,
		isTransparent = false,
		state = 'init',
		showGuideLine = false,
		customFooter = null,
		onChange,
		onSend,
		onStop,
		onAccept,
		onDiscard,
		showRemove = false,
		banner = null,
		error = null,
	}: BlockAIControlProps,
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
	}, [ value ] );

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
		[ lastValue, state ]
	);

	const discardHandler = useCallback( () => {
		onDiscard?.();
	}, [] );

	const cancelEdit = useCallback( () => {
		debug( 'cancelEdit, revert to last value', lastValue );
		onChange?.( lastValue || '' );
		setEditRequest( false );
	}, [ lastValue ] );

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
			sendHandler();
		},
		{
			target: promptUserInputRef,
		}
	);

	const actions = (
		<>
			{ ( ! showAccept || editRequest ) && (
				<div className="jetpack-components-ai-control__controls-prompt_button_wrapper">
					{ ! loading ? (
						<>
							{ editRequest && (
								<Button
									className="jetpack-components-ai-control__controls-prompt_button"
									onClick={ cancelEdit }
									variant="secondary"
									label={ __( 'Cancel', 'jetpack-ai-client' ) }
								>
									{ showButtonLabels ? (
										__( 'Cancel', 'jetpack-ai-client' )
									) : (
										<Icon icon={ closeSmall } />
									) }
								</Button>
							) }

							{ showRemove && ! editRequest && ! value?.length && onDiscard && (
								<Button
									className="jetpack-components-ai-control__controls-prompt_button"
									onClick={ discardHandler }
									variant="secondary"
									label={ __( 'Cancel', 'jetpack-ai-client' ) }
								>
									{ showButtonLabels ? (
										__( 'Cancel', 'jetpack-ai-client' )
									) : (
										<Icon icon={ closeSmall } />
									) }
								</Button>
							) }

							{ value?.length > 0 && (
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
							) }
						</>
					) : (
						<Button
							className="jetpack-components-ai-control__controls-prompt_button"
							onClick={ onStop }
							variant="secondary"
							label={ __( 'Stop request', 'jetpack-ai-client' ) }
						>
							{ showButtonLabels ? (
								__( 'Stop', 'jetpack-ai-client' )
							) : (
								<Icon icon={ closeSmall } />
							) }
						</Button>
					) }
				</div>
			) }
			{ showAccept && ! editRequest && (
				<div className="jetpack-components-ai-control__controls-prompt_button_wrapper">
					{ ( value?.length > 0 || lastValue === null ) && (
						<ButtonGroup>
							<Button
								className="jetpack-components-ai-control__controls-prompt_button"
								label={ __( 'Discard', 'jetpack-ai-client' ) }
								onClick={ discardHandler }
								tooltipPosition="top"
							>
								<Icon icon={ trash } />
							</Button>
							<Button
								className="jetpack-components-ai-control__controls-prompt_button"
								label={ __( 'Regenerate', 'jetpack-ai-client' ) }
								onClick={ () => onSend?.( value ) }
								tooltipPosition="top"
								disabled={ ! value?.length || value === null || disabled }
							>
								<Icon icon={ regenerate } />
							</Button>
						</ButtonGroup>
					) }
					<Button
						className="jetpack-components-ai-control__controls-prompt_button"
						onClick={ onAccept }
						variant="primary"
						label={ acceptLabel }
					>
						{ showButtonLabels ? acceptLabel : <Icon icon={ check } /> }
					</Button>
				</div>
			) }
		</>
	);

	const message =
		showGuideLine && ! loading && ! editRequest && ( customFooter || <GuidelineMessage /> );

	return (
		<AIControl
			disabled={ disabled || loading }
			value={ value }
			placeholder={ placeholder }
			isTransparent={ isTransparent }
			state={ state }
			onChange={ changeHandler }
			banner={ banner }
			error={ error }
			actions={ actions }
			message={ message }
			promptUserInputRef={ promptUserInputRef }
		/>
	);
}

export default forwardRef( BlockAIControl );
