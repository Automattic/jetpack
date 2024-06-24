/**
 * External dependencies
 */
import { Button, Tooltip } from '@wordpress/components';
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import './ai-image-modal.scss';
import UpgradePrompt from '../../../../../blocks/ai-assistant/components/upgrade-prompt';
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
	postContent = null,
	handlePreviousImage = () => {},
	handleNextImage = () => {},
	acceptButton = null,
	autoStart = false,
	autoStartAction = null,
	generateButtonLabel = null,
}: {
	title: string;
	cost: number;
	open: boolean;
	placement: string;
	images: CarrouselImages;
	currentIndex?: number;
	onClose?: () => void;
	onTryAgain?: ( { userPrompt }: { userPrompt?: string } ) => void;
	onGenerate?: ( { userPrompt }: { userPrompt?: string } ) => void;
	generating?: boolean;
	notEnoughRequests?: boolean;
	requireUpgrade?: boolean;
	currentLimit?: number;
	currentUsage?: number;
	isUnlimited?: boolean;
	upgradeDescription?: string;
	hasError?: boolean;
	postContent?: string;
	handlePreviousImage: () => void;
	handleNextImage: () => void;
	acceptButton: JSX.Element;
	autoStart?: boolean;
	autoStartAction?: ( { userPrompt }: { userPrompt?: string } ) => void;
	generateButtonLabel?: string;
} ) {
	const [ userPrompt, setUserPrompt ] = useState( '' );
	const triggeredAutoGeneration = useRef( false );

	const handleUserPromptChange = useCallback(
		( e: React.ChangeEvent< HTMLTextAreaElement > ) => {
			setUserPrompt( e.target.value );
		},
		[ setUserPrompt ]
	);

	const handleTryAgain = useCallback( () => {
		onTryAgain?.( { userPrompt } );
	}, [ onTryAgain, userPrompt ] );

	const handleGenerate = useCallback( () => {
		onGenerate?.( { userPrompt } );
	}, [ onGenerate, userPrompt ] );

	const costTooltipTextSingular = __( '1 request per image', 'jetpack' );

	const costTooltipTextPlural = sprintf(
		// Translators: %d is the cost of generating one image.
		__( '%d requests per image', 'jetpack' ),
		cost
	);

	const costTooltipText = cost === 1 ? costTooltipTextSingular : costTooltipTextPlural;

	// Controllers
	const disableInstructions = notEnoughRequests || generating;
	const showUpgrade = ( requireUpgrade || notEnoughRequests ) && ! generating;
	const showCounter = Boolean( ! isUnlimited && cost && currentLimit );
	const disableTryAgainButton = ! userPrompt && ! postContent;
	const disableGenerateButton =
		notEnoughRequests || generating || ( ! userPrompt && ! postContent );

	const tryAgainButton = (
		<Button onClick={ handleTryAgain } variant="secondary" disabled={ disableTryAgainButton }>
			{ __( 'Try again', 'jetpack' ) }
		</Button>
	);

	const generateButton = (
		<Tooltip text={ costTooltipText } placement="bottom">
			<Button
				onClick={ handleGenerate }
				variant="secondary"
				isBusy={ generating }
				disabled={ disableGenerateButton }
			>
				{ generateButtonLabel }
			</Button>
		</Tooltip>
	);

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
						<div className="ai-image-modal__user-prompt">
							<div className="ai-image-modal__user-prompt-textarea">
								<textarea
									disabled={ disableInstructions }
									maxLength={ 1000 }
									rows={ 2 }
									onChange={ handleUserPromptChange }
									placeholder={ __(
										'Include optional instructions to generate a new image',
										'jetpack'
									) }
								></textarea>
							</div>
						</div>
						{ showUpgrade && (
							<UpgradePrompt
								description={ upgradeDescription }
								placement={ FEATURED_IMAGE_UPGRADE_PROMPT_PLACEMENT }
								useLightNudge={ true }
							/>
						) }
						<div className="ai-image-modal__actions">
							<div className="ai-image-modal__actions-left">
								{ showCounter && (
									<UsageCounter
										cost={ cost }
										currentLimit={ currentLimit }
										currentUsage={ currentUsage }
									/>
								) }
							</div>
							<div className="ai-image-modal__actions-right">
								<div className="ai-image-modal__action-buttons">
									{ hasError ? tryAgainButton : generateButton }
								</div>
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
