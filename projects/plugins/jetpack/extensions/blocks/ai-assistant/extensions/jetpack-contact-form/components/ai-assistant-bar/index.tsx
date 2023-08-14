/**
 * External dependencies
 */
import { useAiContext, AIControl, ERROR_QUOTA_EXCEEDED } from '@automattic/jetpack-ai-client';
import { serialize } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { useDispatch } from '@wordpress/data';
import {
	useContext,
	useCallback,
	useRef,
	useState,
	useEffect,
	createPortal,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import classNames from 'classnames';
import UpgradePrompt from '../../../../components/upgrade-prompt';
import useAIFeature from '../../../../hooks/use-ai-feature';
import { PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, getPrompt } from '../../../../lib/prompt';
import { AiAssistantUiContext } from '../../ui-handler/context';
import { AI_ASSISTANT_JETPACK_FORM_NOTICE_ID } from '../../ui-handler/with-ui-handler-data-provider';
import './style.scss';

/*
 * Core viewport breakpoints.
 * @see https://github.com/WordPress/gutenberg/blob/d5d8533cf2cc04bb005bda147114cf00782d6c38/packages/base-styles/_breakpoints.scss#L5-L14
 */
const BREAKPOINTS = {
	huge: 1440,
	wide: 1280,
	large: 960,
	medium: 782,
	small: 600,
	mobile: 480,
};

/**
 * Return the serialized content from the childrens block.
 *
 * @param {string} clientId - The block client ID.
 * @returns {string}          The serialized content.
 */
function getSerializedContentFromBlock( clientId: string ): string {
	if ( ! clientId?.length ) {
		return '';
	}

	const block = select( 'core/block-editor' ).getBlock( clientId );
	if ( ! block ) {
		return '';
	}

	const { innerBlocks } = block;
	if ( ! innerBlocks?.length ) {
		return '';
	}

	return innerBlocks.reduce( ( acc, innerBlock ) => {
		return acc + serialize( innerBlock ) + '\n\n';
	}, '' );
}

export default function AiAssistantBar( {
	clientId,
	className = '',
}: {
	clientId: string;
	className?: string;
} ) {
	const wrapperRef = useRef< HTMLDivElement >( null );
	const inputRef = useRef< HTMLInputElement >( null );

	const { inputValue, setInputValue, isFixed, isVisible, assistantAnchor } =
		useContext( AiAssistantUiContext );

	const { requestSuggestion, requestingState, stopSuggestion, requestingError } = useAiContext( {
		onDone: () => {
			setTimeout( () => {
				inputRef.current?.focus?.();
			}, 10 );
		},
	} );

	const { requireUpgrade } = useAIFeature();

	const siteRequireUpgrade = requestingError?.code === ERROR_QUOTA_EXCEEDED || requireUpgrade;

	const isLoading = requestingState === 'requesting' || requestingState === 'suggesting';

	const placeholder = __( 'Ask Jetpack AI to create your form', 'jetpack' );

	const loadingPlaceholder = __( 'Creating your form. Please wait a few moments.', 'jetpack' );

	const { removeNotice } = useDispatch( noticesStore );

	const onSend = useCallback( () => {
		// Remove previous error notice.
		removeNotice( AI_ASSISTANT_JETPACK_FORM_NOTICE_ID );

		const prompt = getPrompt( PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, {
			request: inputValue,
			content: getSerializedContentFromBlock( clientId ),
		} );

		requestSuggestion( prompt, { feature: 'jetpack-form-ai-extension' } );
	}, [ clientId, inputValue, removeNotice, requestSuggestion ] );

	/*
	 * Auto-resize mode.
	 * Update the bar layout depending on the component width.
	 */
	const isMobileModeRef = useRef( isFixed );
	const [ isMobileMode, setMobileMode ] = useState( isFixed );

	const observerRef = useRef( null );

	useEffect( () => {
		// Get the Assistant bar DOM element.
		const barElement = wrapperRef?.current;
		if ( ! barElement ) {
			return;
		}

		// Only create a new observer if there isn't one already
		if ( ! observerRef.current ) {
			observerRef.current = new ResizeObserver( entries => {
				// Bail erly if the bar is already fixed.
				if ( isFixed ) {
					return setMobileMode( true );
				}

				const barWidth = entries[ 0 ].contentRect.width;
				const isMobileModeBasedOnWidth = barWidth < BREAKPOINTS.mobile;

				// Only update the state if the mode has changed.
				if ( isMobileModeBasedOnWidth !== isMobileModeRef.current ) {
					isMobileModeRef.current = isMobileModeBasedOnWidth; // Update the ref to be able to compare later.
					setMobileMode( isMobileModeBasedOnWidth ); // Update the state (and re-render)
				}
			} );
		}

		// Start observing the Assistant bar element.
		observerRef.current.observe( barElement );

		return () => {
			// Disconnect the observer when the component is unmounted.
			observerRef.current?.disconnect();
		};
	}, [ isFixed ] );

	if ( ! isVisible ) {
		return null;
	}

	const shouldAnchorToBlockToolbar = isFixed && assistantAnchor;

	// Assistant bar component.
	const AiAssistantBarComponent = (
		<div
			ref={ wrapperRef }
			className={ classNames( 'jetpack-ai-assistant__bar', {
				[ className ]: className,
				'is-fixed': shouldAnchorToBlockToolbar,
				'is-mobile-mode': isMobileMode,
			} ) }
		>
			{ siteRequireUpgrade && <UpgradePrompt /> }
			<AIControl
				ref={ inputRef }
				disabled={ siteRequireUpgrade }
				value={ isLoading ? undefined : inputValue }
				placeholder={ isLoading ? loadingPlaceholder : placeholder }
				onChange={ setInputValue }
				onSend={ onSend }
				onStop={ stopSuggestion }
				state={ requestingState }
				isOpaque={ siteRequireUpgrade }
				showButtonsLabel={ ! isMobileMode && ! isFixed }
			/>
		</div>
	);

	// Check if the Assistant bar should be rendered in the Assistant anchor (fixed mode)
	if ( shouldAnchorToBlockToolbar ) {
		return createPortal( AiAssistantBarComponent, assistantAnchor );
	}

	// Render in the editor canvas.
	return AiAssistantBarComponent;
}
