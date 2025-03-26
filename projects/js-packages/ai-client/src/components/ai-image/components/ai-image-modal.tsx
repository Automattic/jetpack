/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { SelectControl } from '@wordpress/components';
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import {
	IMAGE_STYLE_NONE,
	IMAGE_STYLE_AUTO,
	ImageStyleObject,
	ImageStyle,
} from '../../../hooks/use-image-generator/constants.js';
import { AiModalPromptInput } from '../../../logo-generator/index.js';
import AiModalFooter from '../../ai-modal-footer/index.js';
import AiAssistantModal from '../../modal/index.js';
import QuotaExceededMessage from '../../quota-exceeded-message/index.js';
import Carrousel, { CarrouselImages } from './carrousel.js';
import UsageCounter from './usage-counter.js';
import './ai-image-modal.scss';

type AiImageModalProps = {
	title: string;
	cost: number;
	open: boolean;
	placement: string;
	images: CarrouselImages;
	currentIndex: number;
	onClose: () => void;
	onTryAgain: ( { userPrompt, style }: { userPrompt?: string; style?: string } ) => void;
	onGenerate: ( { userPrompt, style }: { userPrompt?: string; style?: string } ) => void;
	generating: boolean;
	notEnoughRequests: boolean;
	requireUpgrade: boolean;
	currentLimit: number;
	currentUsage: number;
	isUnlimited: boolean;
	upgradeDescription: string;
	hasError: boolean;
	handlePreviousImage: () => void;
	handleNextImage: () => void;
	acceptButton: React.JSX.Element;
	autoStart?: boolean;
	autoStartAction?: ( { userPrompt, style }: { userPrompt?: string; style?: string } ) => void;
	generateButtonLabel: string;
	instructionsPlaceholder: string;
	imageStyles?: Array< ImageStyleObject >;
	onGuessStyle?: ( userPrompt: string ) => Promise< ImageStyle >;
	prompt?: string;
	setPrompt?: ( userPrompt: string ) => void;
	initialStyle?: ImageStyle;
	inputDisabled?: boolean;
	actionDisabled?: boolean;
};

const FEATURED_IMAGE_UPGRADE_PROMPT_PLACEMENT = 'ai-image-generator';

const debug = debugFactory( 'jetpack-ai-client:ai-image-modal' );

/**
 * AiImageModal component
 * @param {AiImageModalProps} props - The component properties.
 * @return {React.ReactElement} - rendered component.
 */
export default function AiImageModal( {
	title,
	cost,
	open,
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
	imageStyles = [],
	onGuessStyle = null,
	prompt = '',
	setPrompt = () => {},
	initialStyle = null,
	inputDisabled = false,
	actionDisabled = false,
}: AiImageModalProps ) {
	const { tracks } = useAnalytics();
	const { recordEvent: recordTracksEvent } = tracks;
	const triggeredAutoGeneration = useRef( false );
	const [ showStyleSelector, setShowStyleSelector ] = useState( false );
	const [ style, setStyle ] = useState< ImageStyle >( null );
	const [ styles, setStyles ] = useState< Array< ImageStyleObject > >( imageStyles || [] );

	const handleTryAgain = useCallback( () => {
		onTryAgain?.( { userPrompt: prompt, style } );
	}, [ onTryAgain, prompt, style ] );

	const handleGenerate = useCallback( async () => {
		if ( style === IMAGE_STYLE_AUTO && onGuessStyle ) {
			recordTracksEvent( 'jetpack_ai_general_image_guess_style', {
				context: 'block-editor',
				tool: 'image',
			} );
			const guessedStyle = ( await onGuessStyle( prompt ) ) || IMAGE_STYLE_NONE;
			setStyle( guessedStyle );
			debug( 'guessed style', guessedStyle );
			onGenerate?.( { userPrompt: prompt, style: guessedStyle } );
		} else {
			onGenerate?.( { userPrompt: prompt, style } );
		}
	}, [ onGenerate, prompt, style, onGuessStyle, recordTracksEvent ] );

	const updateStyle = useCallback(
		( imageStyle: ImageStyle ) => {
			debug( 'change style', imageStyle );
			setStyle( imageStyle );
			recordTracksEvent( 'jetpack_ai_image_generator_switch_style', {
				context: 'block-editor',
				style: imageStyle,
			} );
		},
		[ setStyle, recordTracksEvent ]
	);

	// Controllers
	const upgradePromptVisible = ( requireUpgrade || notEnoughRequests ) && ! generating;
	const counterVisible = Boolean( ! isUnlimited && cost && currentLimit );

	const generateLabel = __( 'Generate', 'jetpack-ai-client' );
	const tryAgainLabel = __( 'Try again', 'jetpack-ai-client' );

	/**
	 * Trigger image generation automatically.
	 */
	useEffect( () => {
		if ( autoStart && open ) {
			if ( ! triggeredAutoGeneration.current ) {
				triggeredAutoGeneration.current = true;
				autoStartAction?.( {} );
			}
		}
	}, [ autoStart, autoStartAction, open ] );

	// initialize styles dropdown
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
			setStyle( initialStyle || IMAGE_STYLE_NONE );
		}
	}, [ imageStyles, initialStyle ] );

	return (
		<>
			{ open && (
				<AiAssistantModal handleClose={ onClose } title={ title }>
					<div className="ai-image-modal__content">
						{ showStyleSelector && (
							<div style={ { display: 'flex', alignItems: 'center', gap: 16 } }>
								<div style={ { fontWeight: 500, flexGrow: 1 } }>
									{ __( 'Generate image', 'jetpack-ai-client' ) }
								</div>
								<div>
									<SelectControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize={ true }
										value={ style }
										options={ styles }
										onChange={ updateStyle }
									/>
								</div>
							</div>
						) }
						<AiModalPromptInput
							prompt={ prompt }
							setPrompt={ setPrompt }
							disabled={ inputDisabled }
							actionDisabled={ actionDisabled }
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
						<AiModalFooter />
					</div>
				</AiAssistantModal>
			) }
		</>
	);
}
