/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Tooltip, SelectControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import debugFactory from 'debug';
import { useCallback, useEffect, useState, useRef, Dispatch, SetStateAction } from 'react';
/**
 * Internal dependencies
 */
import { IMAGE_STYLE_NONE, IMAGE_STYLE_AUTO } from '../../hooks/use-image-generator/constants.js';
import AiIcon from '../assets/icons/ai.js';
import {
	EVENT_GENERATE,
	MINIMUM_PROMPT_LENGTH,
	EVENT_UPGRADE,
	EVENT_PLACEMENT_INPUT_FOOTER,
	EVENT_SWITCH_STYLE,
	EVENT_GUESS_STYLE,
} from '../constants.js';
import { useCheckout } from '../hooks/use-checkout.js';
import useLogoGenerator from '../hooks/use-logo-generator.js';
import useRequestErrors from '../hooks/use-request-errors.js';
import { FairUsageNotice } from './fair-usage-notice.js';
import { UpgradeNudge } from './upgrade-nudge.js';
import './prompt.scss';
/**
 * Types
 */
import type { ImageStyle, ImageStyleObject } from '../../hooks/use-image-generator/constants.js';

const debug = debugFactory( 'jetpack-ai-calypso:prompt-box' );

type PromptProps = {
	initialPrompt?: string;
};

export const AiModalPromptInput = ( {
	prompt = '',
	setPrompt = () => {},
	disabled = false,
	actionDisabled = false,
	generateHandler = () => {},
	placeholder = '',
	buttonLabel = '',
}: {
	prompt: string;
	setPrompt: Dispatch< SetStateAction< string > >;
	disabled: boolean;
	actionDisabled: boolean;
	generateHandler: () => void;
	placeholder?: string;
	buttonLabel?: string;
} ) => {
	const inputRef = useRef< HTMLDivElement | null >( null );

	const onPromptInput = ( event: React.ChangeEvent< HTMLInputElement > ) => {
		setPrompt( event.target.textContent || '' );
	};

	const onPromptPaste = ( event: React.ClipboardEvent< HTMLInputElement > ) => {
		event.preventDefault();

		const selection = event.currentTarget.ownerDocument.getSelection();
		if ( ! selection || ! selection.rangeCount ) {
			return;
		}

		// Paste plain text only
		const text = event.clipboardData.getData( 'text/plain' );

		selection.deleteFromDocument();
		const range = selection.getRangeAt( 0 );
		range.insertNode( document.createTextNode( text ) );
		selection.collapseToEnd();

		setPrompt( inputRef.current?.textContent || '' );
	};

	const onKeyDown = ( event: React.KeyboardEvent ) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			generateHandler();
		}
		event.stopPropagation();
	};

	useEffect( () => {
		// Update prompt text node when prop changes
		if ( inputRef.current && inputRef.current.textContent !== prompt ) {
			inputRef.current.textContent = prompt;
		}
	}, [ prompt ] );

	// fix for contenteditable divs not being able to be cleared by the user
	// as per default browser behavior
	const onKeyUp = () => {
		if ( inputRef.current?.textContent === '' ) {
			inputRef.current.innerHTML = '';
		}
	};

	return (
		<div className="jetpack-ai-image-generator__prompt-query">
			<div
				role="textbox"
				tabIndex={ 0 }
				ref={ inputRef }
				contentEditable={ ! disabled }
				// The content editable div is expected to be updated by the enhance prompt, so warnings are suppressed
				suppressContentEditableWarning
				className="prompt-query__input"
				onInput={ onPromptInput }
				onPaste={ onPromptPaste }
				onKeyDown={ onKeyDown }
				onKeyUp={ onKeyUp }
				data-placeholder={ placeholder }
			></div>
			<Button
				variant="primary"
				className="jetpack-ai-image-generator__prompt-submit"
				onClick={ generateHandler }
				disabled={ actionDisabled }
			>
				{ buttonLabel || __( 'Generate', 'jetpack-ai-client' ) }
			</Button>
		</div>
	);
};

export const Prompt = ( { initialPrompt = '' }: PromptProps ) => {
	const { tracks } = useAnalytics();
	const { recordEvent: recordTracksEvent } = tracks;
	const [ prompt, setPrompt ] = useState< string >( initialPrompt );
	const [ requestsRemaining, setRequestsRemaining ] = useState( 0 );
	const { enhancePromptFetchError, logoFetchError } = useRequestErrors();
	const { nextTierCheckoutURL: checkoutUrl, hasNextTier } = useCheckout();
	const hasPrompt = prompt?.length >= MINIMUM_PROMPT_LENGTH;
	const [ showStyleSelector, setShowStyleSelector ] = useState( false );
	const [ style, setStyle ] = useState< ImageStyle >( null );
	const [ styles, setStyles ] = useState< Array< ImageStyleObject > >( [] );

	const {
		generateLogo,
		enhancePrompt,
		setIsEnhancingPrompt,
		isBusy,
		isEnhancingPrompt,
		site,
		getAiAssistantFeature,
		requireUpgrade,
		context,
		tierPlansEnabled,
		imageStyles,
		guessStyle,
	} = useLogoGenerator();

	const enhancingLabel = __( 'Enhancing…', 'jetpack-ai-client' );
	const enhanceLabel = __( 'Enhance prompt', 'jetpack-ai-client' );
	const enhanceButtonLabel = isEnhancingPrompt ? enhancingLabel : enhanceLabel;

	const inputRef = useRef< HTMLDivElement | null >( null );

	const onEnhance = useCallback( async () => {
		debug( 'Enhancing prompt', prompt );
		setIsEnhancingPrompt( true );
		recordTracksEvent( EVENT_GENERATE, { context, tool: 'enhance-prompt' } );

		try {
			const enhancedPrompt = await enhancePrompt( { prompt } );
			setPrompt( enhancedPrompt );
			setIsEnhancingPrompt( false );
		} catch ( error ) {
			debug( 'Error enhancing prompt', error );
			setIsEnhancingPrompt( false );
		}
	}, [ context, enhancePrompt, prompt, setIsEnhancingPrompt ] );

	const featureData = getAiAssistantFeature( String( site?.id || '' ) );

	const currentLimit = featureData?.currentTier?.value || 0;
	const currentUsage = featureData?.usagePeriod?.requestsCount || 0;
	const isUnlimited = currentLimit === 1;

	useEffect( () => {
		if ( currentLimit - currentUsage <= 0 ) {
			setRequestsRemaining( 0 );
		} else {
			setRequestsRemaining( currentLimit - currentUsage );
		}
	}, [ currentLimit, currentUsage ] );

	useEffect( () => {
		// Update prompt text node after enhancement
		if ( inputRef.current && inputRef.current.textContent !== prompt ) {
			inputRef.current.textContent = prompt;
		}
	}, [ prompt ] );

	useEffect( () => {
		if ( imageStyles && imageStyles.length > 0 ) {
			// Sort styles to have "None" and "Auto" first
			setStyles(
				[
					imageStyles.find( ( { value } ) => value === IMAGE_STYLE_NONE ),
					imageStyles.find( ( { value } ) => value === IMAGE_STYLE_AUTO ),
					...imageStyles.filter(
						( { value } ) => ! [ IMAGE_STYLE_NONE, IMAGE_STYLE_AUTO ].includes( value )
					),
				].filter( v => v ) // simplest way to get rid of empty values
			);
			setShowStyleSelector( true );
			setStyle( IMAGE_STYLE_NONE );
		} else {
			setStyles( [] );
			setShowStyleSelector( false );
			setStyle( null );
		}
	}, [ imageStyles ] );

	const onGenerate = useCallback( async () => {
		debug( context );
		if ( style === IMAGE_STYLE_AUTO ) {
			setIsEnhancingPrompt( true );
			recordTracksEvent( EVENT_GUESS_STYLE, { context, tool: 'image' } );
			const guessedStyle = ( await guessStyle( prompt ) ) || IMAGE_STYLE_NONE;
			setStyle( guessedStyle );
			recordTracksEvent( EVENT_GENERATE, { context, tool: 'image', style: guessedStyle } );
			setIsEnhancingPrompt( false );
			generateLogo( { prompt, style: guessedStyle } );
		} else {
			recordTracksEvent( EVENT_GENERATE, { context, tool: 'image', style } );
			generateLogo( { prompt, style } );
		}
	}, [ context, generateLogo, prompt, style ] );

	const onUpgradeClick = () => {
		recordTracksEvent( EVENT_UPGRADE, { context, placement: EVENT_PLACEMENT_INPUT_FOOTER } );
	};

	const updateStyle = useCallback(
		( imageStyle: ImageStyle ) => {
			debug( 'change style', imageStyle );
			setStyle( imageStyle );
			recordTracksEvent( EVENT_SWITCH_STYLE, { context, style: imageStyle } );
		},
		[ context, setStyle, recordTracksEvent ]
	);

	return (
		<div className="jetpack-ai-logo-generator__prompt">
			<div className="jetpack-ai-logo-generator__prompt-header">
				<div className="jetpack-ai-logo-generator__prompt-label">
					{ __( 'Describe your site:', 'jetpack-ai-client' ) }
				</div>
				<div className="jetpack-ai-logo-generator__prompt-actions">
					<Button
						variant="link"
						disabled={ isBusy || requireUpgrade || ! hasPrompt }
						onClick={ onEnhance }
					>
						<AiIcon />
						{ enhanceButtonLabel }
					</Button>
				</div>
				{ showStyleSelector && (
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize={ true }
						value={ style }
						options={ styles }
						onChange={ updateStyle }
						disabled={ isBusy || requireUpgrade }
					/>
				) }
			</div>
			<AiModalPromptInput
				prompt={ prompt }
				setPrompt={ setPrompt }
				generateHandler={ onGenerate }
				disabled={ isBusy || requireUpgrade }
				actionDisabled={ isBusy || requireUpgrade || ! hasPrompt }
				placeholder={ __(
					'Describe your site or simply ask for a logo specifying some details about it',
					'jetpack-ai-client'
				) }
			/>
			<div className="jetpack-ai-logo-generator__prompt-footer">
				{ ! isUnlimited && ! requireUpgrade && (
					<div className="jetpack-ai-logo-generator__prompt-requests">
						<div>
							{ sprintf(
								// translators: %u is the number of requests
								__( '%u requests remaining.', 'jetpack-ai-client' ),
								requestsRemaining
							) }
						</div>
						{ hasNextTier && (
							<>
								&nbsp;
								<Button
									variant="link"
									href={ checkoutUrl }
									target="_blank"
									onClick={ onUpgradeClick }
								>
									{ __( 'Upgrade', 'jetpack-ai-client' ) }
								</Button>
							</>
						) }
						&nbsp;
						<Tooltip
							text={ __(
								'Logo generation costs 10 requests; prompt enhancement costs 1 request each',
								'jetpack-ai-client'
							) }
							placement="bottom"
						>
							<Icon className="prompt-footer__icon" icon={ info } />
						</Tooltip>
					</div>
				) }
				{ requireUpgrade && tierPlansEnabled && <UpgradeNudge /> }
				{ requireUpgrade && ! tierPlansEnabled && <FairUsageNotice /> }
				{ enhancePromptFetchError && (
					<div className="jetpack-ai-logo-generator__prompt-error">
						{ __( 'Error enhancing prompt. Please try again.', 'jetpack-ai-client' ) }
					</div>
				) }
				{ logoFetchError && (
					<div className="jetpack-ai-logo-generator__prompt-error">
						{ __( 'Error generating logo. Please try again.', 'jetpack-ai-client' ) }
					</div>
				) }
			</div>
		</div>
	);
};
