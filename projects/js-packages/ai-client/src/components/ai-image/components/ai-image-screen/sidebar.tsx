/**
 * External dependencies
 */
import { Button, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import QuotaExceededMessage from '../../../quota-exceeded-message/index.tsx';
import { StyleGrid } from './style-grid.tsx';
import styles from './styles.module.scss';
/**
 * Types
 */
import type { SidebarProps } from './types.ts';

const FEATURED_IMAGE_UPGRADE_PROMPT_PLACEMENT = 'ai-image-generator';

/**
 * Sidebar component for the AI Image modal screen
 *
 * @param {SidebarProps} props - Component props
 * @return {JSX.Element} The Sidebar component
 */
export function Sidebar( {
	prompt,
	setPrompt,
	instructionsPlaceholder,
	styles: imageStyles,
	selectedStyle,
	onSelectStyle,
	onGenerate,
	generateButtonLabel,
	generating,
	hasError,
	inputDisabled,
	actionDisabled,
	notEnoughRequests,
	requireUpgrade,
	upgradeDescription,
}: SidebarProps ) {
	const upgradePromptVisible = ( requireUpgrade || notEnoughRequests ) && ! generating;

	const buttonLabel = hasError
		? __( 'Try again', 'jetpack-ai-client' )
		: generateButtonLabel || __( 'Generate', 'jetpack-ai-client' );

	return (
		<div className={ styles.sidebar }>
			<div>
				<div className={ styles.label }>{ __( 'Prompt', 'jetpack-ai-client' ) }</div>
				<TextareaControl
					value={ prompt }
					onChange={ setPrompt }
					placeholder={ instructionsPlaceholder }
					disabled={ inputDisabled }
					rows={ 4 }
					__nextHasNoMarginBottom
				/>
			</div>

			<div>
				<div className={ styles.label }>{ __( 'Image style', 'jetpack-ai-client' ) }</div>
				<StyleGrid
					styles={ imageStyles }
					selectedStyle={ selectedStyle }
					onSelectStyle={ onSelectStyle }
					disabled={ inputDisabled }
				/>
			</div>

			<Button
				variant="secondary"
				className={ styles[ 'generate-button' ] }
				onClick={ onGenerate }
				disabled={ actionDisabled }
				isBusy={ generating }
			>
				{ buttonLabel }
			</Button>

			{ upgradePromptVisible && (
				<QuotaExceededMessage
					description={ upgradeDescription }
					placement={ FEATURED_IMAGE_UPGRADE_PROMPT_PLACEMENT }
					useLightNudge
				/>
			) }
		</div>
	);
}
