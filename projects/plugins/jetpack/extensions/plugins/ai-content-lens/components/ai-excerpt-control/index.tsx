/*
 * External dependencies
 */
import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
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
	 * Callback to change the number of words in the generated excerpt.
	 */
	onWordsNumberChange?: ( words: number ) => void;
};

export function AiExcerptControl( {
	minWords = 10,
	maxWords = 100,
	disabled,
	words,
	onWordsNumberChange,
}: AiExcerptControlProps ) {
	return (
		<RangeControl
			label={ __( 'Generate', 'jetpack' ) }
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
	);
}
