/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Tooltip } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import debugFactory from 'debug';
import { useCallback, useEffect, useState, useRef } from 'react';
/**
 * Internal dependencies
 */
import AiIcon from '../assets/icons/ai.js';
import {
	EVENT_GENERATE,
	MINIMUM_PROMPT_LENGTH,
	EVENT_UPGRADE,
	EVENT_PLACEMENT_INPUT_FOOTER,
} from '../constants.js';
import { useCheckout } from '../hooks/use-checkout.js';
import useLogoGenerator from '../hooks/use-logo-generator.js';
import useRequestErrors from '../hooks/use-request-errors.js';
import { FairUsageNotice } from './fair-usage-notice.js';
import { UpgradeNudge } from './upgrade-nudge.js';
import './prompt.scss';

const debug = debugFactory( 'jetpack-ai-calypso:prompt-box' );

export const Prompt: React.FC< { initialPrompt?: string } > = ( { initialPrompt = '' } ) => {
	const { tracks } = useAnalytics();
	const { recordEvent: recordTracksEvent } = tracks;
	const [ prompt, setPrompt ] = useState< string >( initialPrompt );
	const [ requestsRemaining, setRequestsRemaining ] = useState( 0 );
	const { enhancePromptFetchError, logoFetchError } = useRequestErrors();
	const { nextTierCheckoutURL: checkoutUrl, hasNextTier } = useCheckout();
	const hasPrompt = prompt?.length >= MINIMUM_PROMPT_LENGTH;

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

	const onGenerate = useCallback( async () => {
		recordTracksEvent( EVENT_GENERATE, { context, tool: 'image' } );
		generateLogo( { prompt } );
	}, [ context, generateLogo, prompt ] );

	const onPromptInput = ( event: React.ChangeEvent< HTMLInputElement > ) => {
		setPrompt( event.target.textContent || '' );
	};

	const onPromptPaste = ( event: React.ClipboardEvent< HTMLInputElement > ) => {
		event.preventDefault();

		const selection = window.getSelection();
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

	const onUpgradeClick = () => {
		recordTracksEvent( EVENT_UPGRADE, { context, placement: EVENT_PLACEMENT_INPUT_FOOTER } );
	};

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
						<span>{ enhanceButtonLabel }</span>
					</Button>
				</div>
			</div>
			<div className="jetpack-ai-logo-generator__prompt-query">
				<div
					ref={ inputRef }
					contentEditable={ ! isBusy && ! requireUpgrade }
					// The content editable div is expected to be updated by the enhance prompt, so warnings are suppressed
					suppressContentEditableWarning
					className="prompt-query__input"
					onInput={ onPromptInput }
					onPaste={ onPromptPaste }
					data-placeholder={ __(
						'Describe your site or simply ask for a logo specifying some details about it',
						'jetpack-ai-client'
					) }
				></div>
				<Button
					variant="primary"
					className="jetpack-ai-logo-generator__prompt-submit"
					onClick={ onGenerate }
					disabled={ isBusy || requireUpgrade || ! hasPrompt }
				>
					{ __( 'Generate', 'jetpack-ai-client' ) }
				</Button>
			</div>
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
