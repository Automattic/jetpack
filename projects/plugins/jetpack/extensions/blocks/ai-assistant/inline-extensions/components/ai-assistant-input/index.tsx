/*
 * External dependencies
 */
import { ExtensionAIControl } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React from 'react';
/*
 * Internal dependencies
 */
import useAICheckout from '../../../hooks/use-ai-checkout';
import useAiFeature from '../../../hooks/use-ai-feature';
import './style.scss';
/*
 * Types
 */
import type { ExtendedInlineBlockProp } from '../../../extensions/ai-assistant';
import type { RequestingErrorProps, RequestingStateProp } from '@automattic/jetpack-ai-client';
import type { ReactElement } from 'react';

export type AiAssistantInputProps = {
	className?: string;
	requestingState: RequestingStateProp;
	requestingError?: RequestingErrorProps;
	inputRef?: React.MutableRefObject< HTMLInputElement | null >;
	wrapperRef?: React.MutableRefObject< HTMLDivElement | null >;
	action?: string;
	blockType: ExtendedInlineBlockProp;
	request: ( question: string ) => void;
	stopSuggestion?: () => void;
	close?: () => void;
	undo?: () => void;
	tryAgain?: () => void;
};

const defaultClassNames = classNames(
	'jetpack-ai-assistant-extension-ai-input',
	'wp-block' // Some themes, like Twenty Twenty, use this class to set the element's side margins.
);

export default function AiAssistantInput( {
	className,
	requestingState,
	requestingError,
	inputRef,
	wrapperRef,
	action,
	blockType,
	request,
	stopSuggestion,
	close,
	undo,
	tryAgain,
}: AiAssistantInputProps ): ReactElement {
	const [ value, setValue ] = useState( '' );
	const [ placeholder, setPlaceholder ] = useState( __( 'Ask Jetpack AI to edit…', 'jetpack' ) );
	const { checkoutUrl } = useAICheckout();
	const { tracks } = useAnalytics();
	const [ requestsRemaining, setRequestsRemaining ] = useState( 0 );
	const [ showUpgradeMessage, setShowUpgradeMessage ] = useState( false );
	const {
		requireUpgrade,
		requestsCount,
		requestsLimit,
		loading: loadingAiFeature,
		nextTier,
		currentTier,
	} = useAiFeature();

	const disabled = useMemo(
		() => requireUpgrade || [ 'requesting', 'suggesting' ].includes( requestingState ),
		[ requireUpgrade, requestingState ]
	);

	const handleSend = useCallback( () => {
		tracks.recordEvent( 'jetpack_ai_assistant_extension_generate', {
			block_type: blockType,
		} );

		request?.( value );
	}, [ blockType, request, tracks, value ] );

	const handleStopSuggestion = useCallback( () => {
		tracks.recordEvent( 'jetpack_ai_assistant_extension_stop', {
			block_type: blockType,
		} );

		stopSuggestion?.();
	}, [ blockType, stopSuggestion, tracks ] );

	function handleClose(): void {
		close?.();
	}

	const handleUndo = useCallback( () => {
		tracks.recordEvent( 'jetpack_ai_assistant_undo', {
			block_type: blockType,
		} );

		undo?.();
	}, [ blockType, tracks, undo ] );

	const handleUpgrade = useCallback( () => {
		tracks.recordEvent( 'jetpack_ai_upgrade_button', {
			current_tier_slug: currentTier?.slug,
			requests_count: requestsCount,
			placement: 'jetpack_ai_assistant_extension',
		} );
	}, [ currentTier?.slug, requestsCount, tracks ] );

	const handleTryAgain = useCallback( () => {
		tracks.recordEvent( 'jetpack_ai_assistant_try_again', {
			block_type: blockType,
		} );

		tryAgain?.();
	}, [ blockType, tracks, tryAgain ] );

	// Clears the input value on reset and when the request is done.
	useEffect( () => {
		if ( [ 'init', 'done' ].includes( requestingState ) ) {
			setValue( '' );
		}
	}, [ requestingState ] );

	// Sets the placeholder to the quick action text once it changes and clear the input value.
	useEffect( () => {
		setPlaceholder( action || __( 'Ask Jetpack AI to edit…', 'jetpack' ) );

		// Clear the input value when the action changes.
		if ( action ) {
			setValue( '' );
		}
	}, [ action ] );

	// Changes the displayed message according to the input value.
	useEffect( () => {
		setShowUpgradeMessage(
			! loadingAiFeature && // Don't display the upgrade message while loading the feature, as we don't have the tier data yet.
				!! nextTier && // Only display it when there is a next tier to upgrade to...
				value.length === 0 // ...and the input is empty.
		);
	}, [ loadingAiFeature, nextTier, value ] );

	// Updates the remaining requests count
	useEffect( () => {
		const remaining = Math.max( requestsLimit - requestsCount, 0 );

		setRequestsRemaining( remaining );
	}, [ requestsLimit, requestsCount ] );

	return (
		<ExtensionAIControl
			className={ classNames( defaultClassNames, className ) }
			placeholder={ placeholder }
			disabled={ disabled }
			value={ value }
			state={ requestingState }
			showGuideLine={ true }
			error={ requestingError }
			requestsRemaining={ requestsRemaining }
			showUpgradeMessage={ showUpgradeMessage }
			upgradeUrl={ checkoutUrl }
			onChange={ setValue }
			onSend={ handleSend }
			onStop={ handleStopSuggestion }
			onClose={ handleClose }
			onUndo={ handleUndo }
			onUpgrade={ handleUpgrade }
			onTryAgain={ handleTryAgain }
			wrapperRef={ wrapperRef }
			ref={ inputRef }
		/>
	);
}
