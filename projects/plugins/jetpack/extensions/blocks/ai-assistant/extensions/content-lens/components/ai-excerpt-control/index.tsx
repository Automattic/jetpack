/*
 * External dependencies
 */
import { Button, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
/**
 * Types and constants
 */

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
	 * Whether the component is busy.
	 */
	isBusy?: boolean;

	/*
	 * Callback to generate suggestions from AI.
	 */
	onGenerate?: () => void;

	/*
	 * Callback to change the number of words in the generated excerpt.
	 */
	onWordsNumberChange?: ( words: number ) => void;
};

export function AiExcerptControl( {
	minWords = 10,
	maxWords = 100,
	disabled,
	words,

	isBusy,
	onGenerate,
	onWordsNumberChange,
}: AiExcerptControlProps ) {
	return (
		<>
			<RangeControl
				label={ __( 'Length (in words)', 'jetpack' ) }
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

			<div className="jetpack-generated-excerpt__generate-buttons-container">
				<Button
					onClick={ () => onGenerate() }
					variant="secondary"
					isBusy={ isBusy }
					disabled={ disabled }
				>
					{ __( 'Generate', 'jetpack' ) }
				</Button>
			</div>
		</>
	);
}
