/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { RangeControl, Button, BaseControl, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import AiSelectModelControl from '../../../../shared/components/ai-select-model-control';
/**
 * Types and constants
 */
import type { LanguageProp } from '../../../../blocks/ai-assistant/components/i18n-dropdown-control';
import type { ToneProp } from '../../../../blocks/ai-assistant/components/tone-dropdown-control';
import type { AiModelTypeProp } from '../../../../shared/components/ai-select-model-control';
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

			{ isSettingActive && (
				<>
					<AiSelectModelControl
						model={ model }
						onModelChange={ onModelChange }
						disabled={ disabled }
					/>

					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Additional request', 'jetpack' ) }
						onChange={ onAdditionalRequestChange }
						value={ additionalRequest }
						disabled={ disabled }
					/>
				</>
			) }

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
		</div>
	);
}
