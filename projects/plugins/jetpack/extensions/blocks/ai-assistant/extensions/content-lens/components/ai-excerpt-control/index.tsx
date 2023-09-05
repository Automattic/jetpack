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

export type AiAssistantExcerptControlProps = {
	/*
	 * Whether the component is disabled.
	 */
	disabled?: boolean;

	/*
	 * The length of the generated excerpt.
	 */
	length?: number;

	/*
	 * The minimum length of the generated excerpt.
	 */
	minLength?: number;

	/*
	 * The maximum length of the generated excerpt.
	 */
	maxLength?: number;

	/*
	 * Whether the component is busy.
	 */
	isBusy?: boolean;

	/*
	 * Callback to generate suggestions from AI.
	 */
	onGenerate?: () => void;

	/*
	 * Callback to change the length of the generated excerpt.
	 */
	onLengthChange?: ( length: number ) => void;
};

export function AiAssistantExcerptControl( {
	minLength = 10,
	maxLength = 100,
	disabled,
	length,

	isBusy,
	onGenerate,
	onLengthChange,
}: AiAssistantExcerptControlProps ) {
	return (
		<>
			<RangeControl
				label={ __( 'Excerpt Length (in words)', 'jetpack' ) }
				value={ length }
				onChange={ onLengthChange }
				min={ minLength }
				max={ maxLength }
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
