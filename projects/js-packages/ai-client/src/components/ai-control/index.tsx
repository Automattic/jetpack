/**
 * External dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { Button, ButtonGroup } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import {
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	closeSmall,
	check,
	arrowUp,
	arrowLeft,
	trash,
	reusableBlock,
} from '@wordpress/icons';
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
		showGuideLine = false,
		onChange = noop,
		onSend = noop,
		onStop = noop,
		onAccept = noop,
		onDiscard = noop,
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
		onDiscard?: () => void;
	},
	ref: React.MutableRefObject< null > // eslint-disable-line @typescript-eslint/ban-types
): React.ReactElement {
	const promptUserInputRef = useRef( null );
	const loading = state === 'requesting' || state === 'suggesting';
	const [ editRequest, setEditRequest ] = React.useState( false );
	const [ lastValue, setLastValue ] = React.useState( '' );

	useEffect( () => {
		if ( editRequest ) {
			promptUserInputRef?.current?.focus();
		}

		if ( ! editRequest && lastValue && value !== lastValue ) {
			onChange?.( lastValue );
		}
	}, [ editRequest, lastValue ] );

	const sendRequest = useCallback( () => {
		setLastValue( value );
		setEditRequest( false );
		onSend?.( value );
	}, [ value ] );

	const changeHandler = useCallback(
		( newValue: string ) => {
			onChange?.( newValue );
			setEditRequest( state !== 'init' && lastValue && lastValue !== newValue );
		},
		[ lastValue, state ]
	);

	const discardHandler = useCallback( () => {
		onDiscard?.();
		onAccept?.();
	}, [] );

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
						onChange={ changeHandler }
						placeholder={ placeholder }
						className="jetpack-components-ai-control__input"
						disabled={ loading || disabled }
						ref={ promptUserInputRef }
					/>
				</div>

				{ ( ! showAccept || editRequest ) && value?.length > 0 && (
					<div className="jetpack-components-ai-control__controls-prompt_button_wrapper">
						{ ! loading ? (
							<>
								{ editRequest && (
									<Button
										className="jetpack-components-ai-control__controls-prompt_button"
										onClick={ () => setEditRequest( false ) }
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

				{ showAccept && ! editRequest && value?.length > 0 && (
					<div className="jetpack-components-ai-control__controls-prompt_button_wrapper">
						<ButtonGroup>
							<Button
								className="jetpack-components-ai-control__controls-prompt_button"
								label={ __( 'Back to edit', 'jetpack-ai-client' ) }
								onClick={ () => setEditRequest( true ) }
								tooltipPosition="top"
							>
								<Icon icon={ arrowLeft } />
							</Button>
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
							>
								<Icon icon={ reusableBlock } />
							</Button>
						</ButtonGroup>
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
			{ showGuideLine && ! loading && ! editRequest && <GuidelineMessage /> }
		</div>
	);
}

export default forwardRef( AIControl );
