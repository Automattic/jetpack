/**
 * Types for AI Image Screen components
 */
import type {
	ImageStyle,
	ImageStyleObject,
} from '../../../../hooks/use-image-generator/constants.ts';
import type { CarrouselImages, CarrouselImageData } from '../carrousel.tsx';
import type { RefObject, JSX } from 'react';

/**
 * Props for the GeneralPurposeImageScreen component
 */
export type GeneralPurposeImageScreenProps = {
	/**
	 * The path for the screen in NavigatorModal
	 */
	path?: string;
	/**
	 * Placement identifier for analytics
	 */
	placement: string;
	/**
	 * Callback when the modal is closed
	 */
	onClose?: () => void;
	/**
	 * Callback when an image is selected
	 */
	onSetImage?: ( image: { id: number; url: string } ) => void;
};

/**
 * Props passed to useAiImageModalScreen hook
 */
export type UseAiImageModalScreenProps = {
	// Screen configuration
	screenPath?: string;

	// Image state from useAiImage hook
	images: CarrouselImages;
	current: number;
	setCurrent: ( value: number | ( ( prev: number ) => number ) ) => void;
	currentImage: CarrouselImageData;
	currentPointer?: CarrouselImageData;
	pointer?: RefObject< number >;
	handlePreviousImage: () => void;
	handleNextImage: () => void;

	// Style state
	imageStyles: ImageStyleObject[];
	guessStyle: ( prompt: string ) => Promise< ImageStyle | null >;
	style: ImageStyle | null;
	setStyle: ( style: ImageStyle ) => void;

	// Prompt state
	prompt: string;
	setPrompt: ( prompt: string ) => void;

	// Actions
	onGenerate: () => void;
	onTryAgain: () => void;
	onAccept: () => void;
	onClose: () => void;

	// Feature state
	generating: boolean;
	hasError: boolean;
	notEnoughRequests: boolean;
	requireUpgrade: boolean;
	upgradeDescription: string | null;
	cost: number;
	currentLimit: number;
	currentUsage: number;
	isUnlimited: boolean;

	// Control state
	inputDisabled: boolean;
	actionDisabled: boolean;
};

/**
 * Props for the Sidebar component
 */
export type SidebarProps = {
	// Prompt
	prompt: string;
	setPrompt: ( prompt: string ) => void;
	instructionsPlaceholder: string;

	// Style
	styles: ImageStyleObject[];
	selectedStyle: ImageStyle | null;
	onSelectStyle: ( style: ImageStyle ) => void;

	// Actions
	onGenerate: () => void;
	generateButtonLabel: string;

	// State
	generating: boolean;
	hasError: boolean;
	inputDisabled: boolean;
	actionDisabled: boolean;

	// Upgrade
	notEnoughRequests: boolean;
	requireUpgrade: boolean;
	upgradeDescription: string | null;
};

/**
 * Props for the Content component
 */
export type ContentProps = {
	images: CarrouselImages;
	currentIndex: number;
	handlePreviousImage: () => void;
	handleNextImage: () => void;
	acceptButton: JSX.Element | null;
};

/**
 * Props for the StyleGrid component
 */
export type StyleGridProps = {
	styles: ImageStyleObject[];
	selectedStyle: ImageStyle | null;
	onSelectStyle: ( style: ImageStyle ) => void;
	disabled?: boolean;
};
