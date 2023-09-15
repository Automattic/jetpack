/*
 * External dependencies
 */
import { AI_MODEL_GPT_3_5_Turbo_16K, AI_MODEL_GPT_4 } from '@automattic/jetpack-ai-client';
import {
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
				title={ __( 'GPT-3.5 Turbo', 'jetpack' ) }
				label={ __( 'GTP-3.5 Turbo', 'jetpack' ) }
				value={ AI_MODEL_GPT_3_5_Turbo_16K }
			/>
			<ToggleGroupControlOption label={ __( 'GPT-4', 'jetpack' ) } value={ AI_MODEL_GPT_4 } />
		</ToggleGroupControl>
	);
}
