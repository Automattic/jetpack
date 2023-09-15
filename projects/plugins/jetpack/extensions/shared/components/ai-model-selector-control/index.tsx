/*
 * External dependencies
 */
import { AI_MODEL_GPT_3_5_Turbo_16K, AI_MODEL_GPT_4 } from '@automattic/jetpack-ai-client';
import {
	RadioControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Types and constants
 */
type AiExcerptControlProps = {
	disabled: boolean;
	model: AiModelTypeProp;
	onModelChange?: ( model: AiModelTypeProp ) => void;
};
import type { AiModelTypeProp } from '@automattic/jetpack-ai-client';

import './style.scss';

export default function AiModelSelectorControl( {
	model,
	onModelChange,
	disabled,
}: AiExcerptControlProps ) {
	const help =
		model === AI_MODEL_GPT_4
			? __(
					'The most capable model, great for tasks that require creativity and advanced reasoning',
					'jetpack'
			  )
			: __( 'The fastest model, great for most everyday tasks.', 'jetpack' );

	/*
	 * Add a fallback for the ToggleGroupControlOption component,
	 * since it is experimental and might not be available in all versions of Gutenberg.
	 */
	if ( ! ToggleGroupControlOption || ! ToggleGroupControl ) {
		return (
			<RadioControl
				label={ __( 'Model', 'jetpack' ) }
				className="ai-model-selector-control__radio-control"
				selected={ model }
				options={ [
					{ label: __( 'GPT-3.5 Turbo', 'jetpack' ), value: AI_MODEL_GPT_3_5_Turbo_16K },
					{ label: __( 'GPT-4', 'jetpack' ), value: AI_MODEL_GPT_4 },
				] }
				onChange={ onModelChange }
				help={ help }
			/>
		);
	}

	return (
		<ToggleGroupControl
			isBlock
			label={ __( 'Model', 'jetpack' ) }
			onChange={ onModelChange }
			value={ model }
			disabled={ disabled }
			help={ help }
		>
			<ToggleGroupControlOption
				label={ __( 'GTP-3.5 Turbo', 'jetpack' ) }
				value={ AI_MODEL_GPT_3_5_Turbo_16K }
			/>
			<ToggleGroupControlOption label={ __( 'GPT-4', 'jetpack' ) } value={ AI_MODEL_GPT_4 } />
		</ToggleGroupControl>
	);
}
