/**
 * External dependencies
 */
import { AiModalPromptInput } from '@automattic/jetpack-ai-client';
import { Button } from '@wordpress/components';
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import './ai-image-modal.scss';
import QuotaExceededMessage from '../../../../../blocks/ai-assistant/components/quota-exceeded-message';
import AiAssistantModal from '../../modal';
import Carrousel, { CarrouselImages } from './carrousel';
import UsageCounter from './usage-counter';

const FEATURED_IMAGE_UPGRADE_PROMPT_PLACEMENT = 'ai-image-generator';

export default function AiImageModal( {
	title,
	cost,
	open,
	placement,
	images,
	currentIndex = 0,
	onClose = null,
	onTryAgain = null,
	onGenerate = null,
	generating = false,
	notEnoughRequests = false,
	requireUpgrade = false,
	currentLimit = null,
	currentUsage = null,
	isUnlimited = false,
	upgradeDescription = null,
	hasError = false,
	handlePreviousImage = () => {},
	handleNextImage = () => {},
	acceptButton = null,
	autoStart = false,
	autoStartAction = null,
	instructionsPlaceholder = null,
}: {
	title: string;
	cost: number;
	open: boolean;
	placement: string;
	images: CarrouselImages;
	currentIndex: number;
	onClose: () => void;
	onTryAgain: ( { userPrompt }: { userPrompt?: string } ) => void;
	onGenerate: ( { userPrompt }: { userPrompt?: string } ) => void;
	generating: boolean;
	notEnoughRequests: boolean;
	requireUpgrade: boolean;
	currentLimit: number;
	currentUsage: number;
	isUnlimited: boolean;
	upgradeDescription: string;
	hasError: boolean;
	postContent?: string;
	handlePreviousImage: () => void;
	handleNextImage: () => void;
	acceptButton: React.JSX.Element;
	autoStart?: boolean;
	autoStartAction?: ( { userPrompt }: { userPrompt?: string } ) => void;
	generateButtonLabel: string;
	instructionsPlaceholder: string;
} ) {
	const [ userPrompt, setUserPrompt ] = useState( '' );
	const triggeredAutoGeneration = useRef( false );

	const handleTryAgain = useCallback( () => {
		onTryAgain?.( { userPrompt } );
	}, [ onTryAgain, userPrompt ] );

	const handleGenerate = useCallback( () => {
		onGenerate?.( { userPrompt } );
	}, [ onGenerate, userPrompt ] );

	// Controllers
	const instructionsDisabled = notEnoughRequests || generating || requireUpgrade;
	const upgradePromptVisible = ( requireUpgrade || notEnoughRequests ) && ! generating;
	const counterVisible = Boolean( ! isUnlimited && cost && currentLimit );

	const generateLabel = __( 'Generate', 'jetpack' );
	const tryAgainLabel = __( 'Try again', 'jetpack' );

	/**
	 * Trigger image generation automatically.
	 */
	useEffect( () => {
		if ( autoStart && open ) {
			if ( ! triggeredAutoGeneration.current ) {
				triggeredAutoGeneration.current = true;
				autoStartAction?.( { userPrompt } );
			}
		}
	}, [ placement, handleGenerate, autoStart, autoStartAction, userPrompt, open ] );

	return (
		<>
			{ open && (
				<AiAssistantModal handleClose={ onClose } title={ title }>
					<div className="ai-image-modal__content">
						<AiModalPromptInput
							prompt={ userPrompt }
							setPrompt={ setUserPrompt }
							disabled={ instructionsDisabled }
							generateHandler={ hasError ? handleTryAgain : handleGenerate }
							placeholder={ instructionsPlaceholder }
							buttonLabel={ hasError ? tryAgainLabel : generateLabel }
						/>
						{ upgradePromptVisible && (
							<QuotaExceededMessage
								description={ upgradeDescription }
								placement={ FEATURED_IMAGE_UPGRADE_PROMPT_PLACEMENT }
								useLightNudge={ true }
							/>
						) }
						<div className="ai-image-modal__actions">
							<div className="ai-image-modal__actions-left">
								{ counterVisible && (
									<UsageCounter
										cost={ cost }
										currentLimit={ currentLimit }
										currentUsage={ currentUsage }
									/>
								) }
							</div>
						</div>
						<div className="ai-image-modal__image-canvas">
							<Carrousel
								images={ images }
								current={ currentIndex }
								handlePreviousImage={ handlePreviousImage }
								handleNextImage={ handleNextImage }
								actions={ acceptButton }
							/>
						</div>
					</div>
					<div className="ai-image-modal__footer">
						<Button
							variant="link"
							className="ai-image-modal__feedback-button"
							href="https://jetpack.com/redirect/?source=jetpack-ai-feedback"
							target="_blank"
						>
							<span>{ __( 'Provide feedback', 'jetpack' ) }</span>
							<Icon icon={ external } className="icon" />
						</Button>
					</div>
				</AiAssistantModal>
			) }
		</>
	);
}
