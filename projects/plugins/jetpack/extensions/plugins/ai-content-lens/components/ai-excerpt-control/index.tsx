/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { RangeControl, Button, BaseControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import {
	I18nMenuDropdown,
	LANGUAGE_MAP,
} from '../../../../blocks/ai-assistant/components/i18n-dropdown-control';
import {
	PROMPT_TONES_MAP,
	ToneDropdownMenu,
} from '../../../../blocks/ai-assistant/components/tone-dropdown-control';
import AiModelSelectorControl from '../../../../shared/components/ai-model-selector-control';
/**
 * Types and constants
 */
import type { LanguageProp } from '../../../../blocks/ai-assistant/components/i18n-dropdown-control';
import type { ToneProp } from '../../../../blocks/ai-assistant/components/tone-dropdown-control';
import type { AiModelTypeProp } from '@automattic/jetpack-ai-client';

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
};

import './style.scss';

export function AiExcerptControl( {
	minWords = 10,
	maxWords = 100,
	disabled,

	words,
	onWordsNumberChange,

	language,
	onLanguageChange,

	tone,
	onToneChange,

	model,
	onModelChange,
}: AiExcerptControlProps ) {
	const [ isSettingActive, setIsSettingActive ] = React.useState( false );

	function toggleSetting() {
		setIsSettingActive( prev => ! prev );
	}

	// const langLabel = language || __( 'Language', 'jetpack' );
	// const toneLabel = tone || __( 'Tone', 'jetpack' );

	const lang = language?.split( ' ' )[ 0 ];
	const langLabel = LANGUAGE_MAP[ lang ]?.label || __( 'Language', 'jetpack' );
	const toneLabel = PROMPT_TONES_MAP[ tone ]?.label || __( 'Tone', 'jetpack' );

	return (
		<div className="jetpack-ai-generate-excerpt-control">
			<BaseControl
				className="jetpack-ai-generate-excerpt-control__header"
				label={ __( 'Settings', 'jetpack' ) }
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
					<I18nMenuDropdown
						disabled={ disabled }
						onChange={ onLanguageChange }
						value={ language }
						label={ langLabel }
					/>

					<ToneDropdownMenu label={ toneLabel } value={ tone } onChange={ onToneChange } />

					<AiModelSelectorControl
						model={ model }
						onModelChange={ onModelChange }
						disabled={ disabled }
					/>
				</>
			) }

			<RangeControl
				label={ __( 'Desired length', 'jetpack' ) }
				value={ words }
				onChange={ onWordsNumberChange }
				min={ minWords }
				max={ maxWords }
				help={ __(
					'Sets the desired length in words for the auto-generated excerpt. The final count may vary due to how AI works.',
					'jetpack'
				) }
				showTooltip={ false }
				disabled={ disabled }
			/>
		</div>
	);
}
