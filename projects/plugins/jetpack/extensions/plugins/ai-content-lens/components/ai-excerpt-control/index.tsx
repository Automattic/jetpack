/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import {
	RangeControl,
	Button,
	BaseControl,
	TextareaControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import { AI_MODEL_GPT_3_5_Turbo, AI_MODEL_GPT_4 } from '../../extend/ai-post-excerpt';
/**
 * Types and constants
 */
import type { LanguageProp } from '../../../../blocks/ai-assistant/components/i18n-dropdown-control';
import type { ToneProp } from '../../../../blocks/ai-assistant/components/tone-dropdown-control';
import type { AiModelTypeProp } from '../../extend/ai-post-excerpt';
export type AiExcerptControlProps = {
	/*
	 * Whether the component is disabled.
	 */
	disabled?: boolean;

	/*
	 * The number of words in the generated excerpt.
	 */
	words?: number;

	/*
	 * The minimum number of words in the generated excerpt.
	 */
	minWords?: number;

	/*
	 * The maximum number of words in the generated excerpt.
	 */
	maxWords?: number;

	/*
	 * Callback to change the number of words in the generated excerpt.
	 */
	onWordsNumberChange?: ( words: number ) => void;

	language?: LanguageProp;
	onLanguageChange?: ( language: LanguageProp ) => void;

	tone?: ToneProp;
	onToneChange?: ( tone: ToneProp ) => void;

	model?: AiModelTypeProp;
	onModelChange?: ( model: AiModelTypeProp ) => void;

	additionalRequest?: string;
	onAdditionalRequestChange?: ( additionalRequest: string ) => void;
};

import './style.scss';

export function AiExcerptControl( {
	minWords = 10,
	maxWords = 100,
	disabled,

	words,
	onWordsNumberChange,

	model,
	onModelChange,

	additionalRequest,
	onAdditionalRequestChange,
}: AiExcerptControlProps ) {
	const [ isSettingActive, setIsSettingActive ] = React.useState( false );

	function toggleSetting() {
		setIsSettingActive( prev => ! prev );
	}

	return (
		<div className="jetpack-ai-generate-excerpt-control">
			<BaseControl
				className="jetpack-ai-generate-excerpt-control__header"
				label={ __( 'Generate', 'jetpack' ) }
			>
				<Button
					label={ __( 'Advanced AI options', 'jetpack' ) }
					icon={ aiAssistantIcon }
					onClick={ toggleSetting }
					isPressed={ isSettingActive }
					isSmall
				/>
			</BaseControl>
			<RangeControl
				value={ words }
				onChange={ onWordsNumberChange }
				min={ minWords }
				max={ maxWords }
				help={ __(
					'Sets the limit for words in auto-generated excerpts. The final count may vary slightly due to sentence structure.',
					'jetpack'
				) }
				showTooltip={ false }
				disabled={ disabled }
			/>

			{ isSettingActive && (
				<>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Model', 'jetpack' ) }
						onChange={ onModelChange }
						value={ model }
					>
						<ToggleGroupControlOption
							label={ __( 'GTP-3.5 Turbo', 'jetpack' ) }
							value={ AI_MODEL_GPT_3_5_Turbo }
						/>
						<ToggleGroupControlOption label={ __( 'GPT-4', 'jetpack' ) } value={ AI_MODEL_GPT_4 } />
					</ToggleGroupControl>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Additional request', 'jetpack' ) }
						onChange={ onAdditionalRequestChange }
						value={ additionalRequest }
						disabled={ disabled }
					/>
				</>
			) }
		</div>
	);
}
