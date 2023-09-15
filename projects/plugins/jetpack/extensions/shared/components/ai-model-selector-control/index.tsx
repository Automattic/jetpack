/*
 * External dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
/**
 * Types and constants
 */
export const AI_MODEL_GPT_3_5_Turbo = 'gpt-3.5-turbo-16k' as const;
export const AI_MODEL_GPT_4 = 'gpt-4' as const;

export type AiModelTypeProp = typeof AI_MODEL_GPT_3_5_Turbo | typeof AI_MODEL_GPT_4;

type AiExcerptControlProps = {
	disabled: boolean;
	model: AiModelTypeProp;
	onModelChange?: ( model: AiModelTypeProp ) => void;
};

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
				value={ AI_MODEL_GPT_3_5_Turbo }
			/>
			<ToggleGroupControlOption label={ __( 'GPT-4', 'jetpack' ) } value={ AI_MODEL_GPT_4 } />
		</ToggleGroupControl>
	);
}
