/*
 * External dependencies
 */
import { ExtensionAIControl } from '@automattic/jetpack-ai-client';
import { useState } from '@wordpress/element';
import React from 'react';
/*
 * Types
 */
import type { RequestingErrorProps, RequestingStateProp } from '@automattic/jetpack-ai-client';
import type { ReactElement } from 'react';

export default function AiAssistantInput( {
	requestingState,
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

	return (
		<>
			<ExtensionAIControl
				disabled={ disabled }
				value={ value }
				state={ requestingState }
				onChange={ setValue }
				onSend={ handleSend }
				onStop={ handleStopSuggestion }
				onClose={ handleClose }
				onUndo={ handleUndo }
				onUpgrade={ handleUpgrade }
			/>
		</>
	);
}
