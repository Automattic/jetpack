/*
 * External dependencies
 */
import { ExtensionAIControl } from '@automattic/jetpack-ai-client';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
/*
 * Types
 */
import type { RequestingErrorProps, RequestingStateProp } from '@automattic/jetpack-ai-client';
import type { ReactElement } from 'react';

export default function AiAssistantInput( {
	requestingState,
	wrapperRef,
	inputRef,
	action,
	request,
	stopSuggestion,
	close,
	undo,
}: {
	clientId?: string;
	postId?: number;
	requestingState: RequestingStateProp;
	requestingError?: RequestingErrorProps;
	suggestion?: string;
	inputRef?: React.MutableRefObject< HTMLInputElement | null >;
	wrapperRef?: React.MutableRefObject< HTMLDivElement | null >;
	action?: string;
	request: ( question: string ) => void;
	stopSuggestion?: () => void;
	close?: () => void;
	undo?: () => void;
} ): ReactElement {
	const [ value, setValue ] = useState( '' );
	const disabled = [ 'requesting', 'suggesting' ].includes( requestingState );

	function handleSend(): void {
		request?.( value );
	}

	function handleStopSuggestion(): void {
		stopSuggestion?.();
	}

	function handleClose(): void {
		close?.();
	}

	function handleUndo(): void {
		undo?.();
	}

	function handleUpgrade(): void {
		throw new Error( 'Function not implemented.' );
	}

	// Clear the input value on reset and when the request is done.
	useEffect( () => {
		if ( [ 'init', 'done' ].includes( requestingState ) ) {
			setValue( '' );
		}
	}, [ requestingState ] );

	// Set the value to the quick action text once it changes.
	useEffect( () => {
		setValue( action || '' );
	}, [ action ] );

	return (
		<ExtensionAIControl
			placeholder={ __( 'Ask Jetpack AI to edit…', 'jetpack' ) }
			disabled={ disabled }
			value={ value }
			state={ requestingState }
			onChange={ setValue }
			onSend={ handleSend }
			onStop={ handleStopSuggestion }
			onClose={ handleClose }
			onUndo={ handleUndo }
			onUpgrade={ handleUpgrade }
			wrapperRef={ wrapperRef }
			ref={ inputRef }
		/>
	);
}
