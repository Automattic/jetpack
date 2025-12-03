import { NavigatorModal, ThemeProvider } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useRef, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import {
	IMAGE_STYLE_NONE,
	IMAGE_STYLE_AUTO,
	ImageStyleObject,
	ImageStyle,
} from '../../../hooks/use-image-generator/constants.ts';
import { Content } from './ai-image-screen/content.tsx';
import { Sidebar } from './ai-image-screen/sidebar.tsx';
import UsageCounter from './usage-counter.tsx';
import type { CarrouselImages } from './carrousel.tsx';
import type { JSX, ReactElement } from 'react';

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
	acceptButton: JSX.Element;
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

const debug = debugFactory( 'jetpack-ai-client:ai-image-modal' );

/**
 * AiImageModal component
 *
 * @param {AiImageModalProps} props - The component properties.
 * @return {ReactElement} - rendered component.
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
	generateButtonLabel,
	instructionsPlaceholder = null,
	imageStyles = [],
	onGuessStyle = null,
	prompt = '',
	setPrompt = () => {},
	initialStyle = null,
	inputDisabled = false,
	actionDisabled = false,
}: AiImageModalProps ): ReactElement {
	const { tracks } = useAnalytics();
	const { recordEvent: recordTracksEvent } = tracks;
	const triggeredAutoGeneration = useRef( false );
	const [ style, setStyle ] = useState< ImageStyle >( initialStyle || IMAGE_STYLE_NONE );
	const [ styles, setStyles ] = useState< Array< ImageStyleObject > >( imageStyles || [] );

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

	// Initialize styles
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
				].filter( v => v )
			);
			setStyle( initialStyle || IMAGE_STYLE_NONE );
		}
	}, [ imageStyles, initialStyle ] );

	const handleTryAgain = () => {
		onTryAgain?.( { userPrompt: prompt, style } );
	};

	const handleGenerate = async () => {
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
	};

	const updateStyle = ( imageStyle: ImageStyle ) => {
		debug( 'change style', imageStyle );
		setStyle( imageStyle );
		recordTracksEvent( 'jetpack_ai_image_generator_switch_style', {
			context: 'block-editor',
			style: imageStyle,
		} );
	};

	// Determine if image is ready for accept button
	const currentImage = images[ currentIndex ];
	const hasImage = Boolean( currentImage?.image || currentImage?.libraryUrl );
	const isImageReady = hasImage && ! currentImage?.generating;
	const counterVisible = Boolean( ! isUnlimited && cost && currentLimit );

	return open ? (
		<ThemeProvider targetDom={ document.body }>
			<NavigatorModal initialPath="/" onClose={ onClose }>
				<NavigatorModal.Screen
					path="/"
					title={ title }
					isScreenLocked
					sidebar={
						<Sidebar
							prompt={ prompt }
							setPrompt={ setPrompt }
							instructionsPlaceholder={
								instructionsPlaceholder ||
								__( 'Describe the image you want to create.', 'jetpack-ai-client' )
							}
							styles={ styles }
							selectedStyle={ style }
							onSelectStyle={ updateStyle }
							onGenerate={ hasError ? handleTryAgain : handleGenerate }
							generateButtonLabel={
								hasError
									? __( 'Try again', 'jetpack-ai-client' )
									: generateButtonLabel || __( 'Generate', 'jetpack-ai-client' )
							}
							generating={ generating }
							hasError={ hasError }
							inputDisabled={ inputDisabled }
							actionDisabled={ actionDisabled }
							notEnoughRequests={ notEnoughRequests }
							requireUpgrade={ requireUpgrade }
							upgradeDescription={ upgradeDescription }
						/>
					}
					footerContent={
						counterVisible ? (
							<UsageCounter
								cost={ cost }
								currentLimit={ currentLimit }
								currentUsage={ currentUsage }
							/>
						) : null
					}
					footerActions={ [
						{
							children: acceptButton?.props?.children || __( 'Select image', 'jetpack-ai-client' ),
							variant: 'primary' as const,
							disabled: ! isImageReady || acceptButton?.props?.disabled,
							onClick: acceptButton?.props?.onClick,
						},
					] }
				>
					<Content
						images={ images }
						currentIndex={ currentIndex }
						handlePreviousImage={ handlePreviousImage }
						handleNextImage={ handleNextImage }
						acceptButton={ null }
					/>
				</NavigatorModal.Screen>
			</NavigatorModal>
		</ThemeProvider>
	) : null;
}
