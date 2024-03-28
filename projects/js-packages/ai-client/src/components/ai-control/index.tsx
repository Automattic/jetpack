/**
 * External dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { Button, ButtonGroup } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { useImperativeHandle, useRef, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall, check, arrowUp, trash, reusableBlock } from '@wordpress/icons';
import classNames from 'classnames';
import { forwardRef } from 'react';
import React from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import AiStatusIndicator from '../ai-status-indicator/index.js';
import { GuidelineMessage } from './message.js';
/**
 * Types
 */
import type { RequestingStateProp } from '../../types.js';
import type { ReactElement } from 'react';
type AiControlProps = {
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
	bannerComponent?: ReactElement;
	errorComponent?: ReactElement;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
 * AI Control component.
 *
 * @param {AiControlProps} props       - Component props.
 * @param {React.MutableRefObject} ref - Ref to the component.
 * @returns {ReactElement}         Rendered component.
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
		showGuideLine = false,
		customFooter = null,
		onChange = noop,
		onSend = noop,
		onStop = noop,
		onAccept = noop,
		onDiscard = null,
		showRemove = false,
		bannerComponent = null,
		errorComponent = null,
	}: AiControlProps,
	ref: React.MutableRefObject< HTMLInputElement >
): ReactElement {
	const promptUserInputRef = useRef( null );
	const loading = state === 'requesting' || state === 'suggesting';
	const [ editRequest, setEditRequest ] = React.useState( false );
	const [ lastValue, setLastValue ] = React.useState( value || null );

	useEffect( () => {
		if ( editRequest ) {
			promptUserInputRef?.current?.focus();
		}

		if ( ! editRequest && lastValue !== null && value !== lastValue ) {
			onChange?.( lastValue );
		}
	}, [ editRequest, lastValue, value ] );

	const sendRequest = useCallback( () => {
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
		onChange( lastValue || '' );
		setEditRequest( false );
	}, [ lastValue ] );

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
			sendRequest();
		},
		{
			target: promptUserInputRef,
		}
	);

	return (
		<div className="jetpack-components-ai-control__container-wrapper">
			{ errorComponent }
			<div className="jetpack-components-ai-control__container">
				{ bannerComponent }
				<div
					className={ classNames( 'jetpack-components-ai-control__wrapper', {
						'is-transparent': isTransparent,
					} ) }
				>
					<AiStatusIndicator state={ state } />

					<div className="jetpack-components-ai-control__input-wrapper">
						<PlainText
							value={ value }
							onChange={ changeHandler }
							placeholder={ placeholder }
							className="jetpack-components-ai-control__input"
							disabled={ loading || disabled }
							ref={ promptUserInputRef }
						/>
					</div>

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
											onClick={ sendRequest }
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
										<Icon icon={ reusableBlock } />
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
				</div>
				{ showGuideLine && ! loading && ! editRequest && ( customFooter || <GuidelineMessage /> ) }
			</div>
		</div>
	);
}

export default forwardRef( AIControl );
