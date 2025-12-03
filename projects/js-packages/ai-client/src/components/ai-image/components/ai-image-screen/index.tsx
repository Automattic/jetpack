/**
 * External dependencies
 */
import { NavigatorModal } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import UsageCounter from '../usage-counter.tsx';
import { Content } from './content.tsx';
import { Sidebar } from './sidebar.tsx';
import styles from './styles.module.scss';
/**
 * Types
 */
import type { UseAiImageModalScreenProps } from './types.ts';

// Screen details type - extract from NavigatorModal.Screen props, using content instead of children
type ScreenDetails = Omit< React.ComponentProps< typeof NavigatorModal.Screen >, 'children' > & {
	content: React.ReactNode;
};

/**
 * Hook to get modal screen details for AI image generation.
 *
 * @param {UseAiImageModalScreenProps} props - Hook props
 * @return {ScreenDetails} Screen configuration object
 */
export function useAiImageModalScreen( {
	screenPath = '/',
	// Image state
	images,
	current,
	currentImage,
	handlePreviousImage,
	handleNextImage,
	// Style state
	imageStyles,
	style,
	setStyle,
	// Prompt state
	prompt,
	setPrompt,
	// Actions
	onGenerate,
	onTryAgain,
	onAccept,
	// Feature state
	generating,
	hasError,
	notEnoughRequests,
	requireUpgrade,
	upgradeDescription,
	cost,
	currentLimit,
	currentUsage,
	isUnlimited,
	// Control state
	inputDisabled,
	actionDisabled,
}: UseAiImageModalScreenProps ): ScreenDetails {
	const hasImage = Boolean( currentImage?.image || currentImage?.libraryUrl );
	const isImageReady = hasImage && ! currentImage?.generating;
	const counterVisible = Boolean( ! isUnlimited && cost && currentLimit );

	const generateButtonLabel =
		images.length > 1
			? __( 'Generate another image', 'jetpack-ai-client' )
			: __( 'Generate', 'jetpack-ai-client' );

	const acceptButton = (
		<Button onClick={ onAccept } variant="primary" disabled={ ! isImageReady }>
			{ __( 'Select image', 'jetpack-ai-client' ) }
		</Button>
	);

	return useMemo(
		() => ( {
			path: screenPath,
			title: __( 'Generate image with AI', 'jetpack-ai-client' ),
			isScreenLocked: true,
			sidebar: (
				<Sidebar
					prompt={ prompt }
					setPrompt={ setPrompt }
					instructionsPlaceholder={ __(
						'This gets filled with a proactive prompt based on the post content, which lets users know Jetpack work automagically.',
						'jetpack-ai-client'
					) }
					styles={ imageStyles }
					selectedStyle={ style }
					onSelectStyle={ setStyle }
					onGenerate={ hasError ? onTryAgain : onGenerate }
					generateButtonLabel={ generateButtonLabel }
					generating={ generating }
					hasError={ hasError }
					inputDisabled={ inputDisabled }
					actionDisabled={ actionDisabled }
					notEnoughRequests={ notEnoughRequests }
					requireUpgrade={ requireUpgrade }
					upgradeDescription={ upgradeDescription }
				/>
			),
			content: (
				<Content
					images={ images }
					currentIndex={ current }
					handlePreviousImage={ handlePreviousImage }
					handleNextImage={ handleNextImage }
					acceptButton={ acceptButton }
				/>
			),
			footerContent: counterVisible ? (
				<div className={ styles[ 'footer-counter' ] }>
					<UsageCounter cost={ cost } currentLimit={ currentLimit } currentUsage={ currentUsage } />
				</div>
			) : null,
			footerActions: [
				{
					children: __( 'Select image', 'jetpack-ai-client' ),
					variant: 'primary' as const,
					disabled: ! isImageReady,
					onClick: onAccept,
				},
			],
		} ),
		[
			screenPath,
			prompt,
			setPrompt,
			imageStyles,
			style,
			setStyle,
			hasError,
			onTryAgain,
			onGenerate,
			generateButtonLabel,
			generating,
			inputDisabled,
			actionDisabled,
			notEnoughRequests,
			requireUpgrade,
			upgradeDescription,
			images,
			current,
			handlePreviousImage,
			handleNextImage,
			isImageReady,
			onAccept,
			counterVisible,
			cost,
			currentLimit,
			currentUsage,
		]
	);
}

export { Sidebar } from './sidebar.tsx';
export { Content } from './content.tsx';
export { StyleGrid } from './style-grid.tsx';
export type { ScreenDetails };
