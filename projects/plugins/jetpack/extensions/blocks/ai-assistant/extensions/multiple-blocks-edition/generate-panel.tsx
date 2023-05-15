/**
 * External dependencies
 */
import {
	PanelBody,
	PanelRow,
	CustomSelectControl,
	ToggleControl,
	Button,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import { LANGUAGE_MAP, defaultLanguage } from '../../i18n-dropdown-control';
import { DEFAULT_PROMPT_TONE, PROMPT_TONES_MAP } from '../../tone-dropdown-control';

// Create a Tone Array ob object with `key` and `name` keys
export const toneOptions = Object.keys( PROMPT_TONES_MAP ).map( key => {
	return {
		key,
		name: `${ PROMPT_TONES_MAP[ key ].emoji } ${ PROMPT_TONES_MAP[ key ].label }`,
	};
} );
const defaultTone = toneOptions.find( option => option.key === DEFAULT_PROMPT_TONE );

// Create a Language Array ob object with `key` and `name` keys
export const langOptions = Object.keys( LANGUAGE_MAP ).map( key => {
	return {
		key,
		name: LANGUAGE_MAP[ key ].label,
	};
} );
const defaultLang = langOptions.find( option => option.key === defaultLanguage );

export default function GenerateContentPanel( { title, setAttributes } ) {
	const [ tone, setTone ] = useState( defaultTone );
	const [ lang, setLang ] = useState( defaultLang );
	const [ action, setAction ] = useState( 'summarize' );
	const [ combineBlocks, setCombineBlocks ] = useState( false );

	return (
		<PanelBody
			title={ __( 'Edit content', 'jetpack' ) }
			className="jetpack-ai-assistant__multiple-blocks-edition-panel"
		>
			<PanelRow>
				<CustomSelectControl
					label={ __( 'Tone', 'jetpack' ) }
					value={ toneOptions.find( option => option.key === tone?.key ) }
					options={ toneOptions }
					onChange={ ( { selectedItem } ) => setTone( selectedItem ) }
				/>
			</PanelRow>

			<PanelRow>
				<CustomSelectControl
					label={ __( 'Language', 'jetpack' ) }
					value={ toneOptions.find( option => option.key === lang?.key ) }
					options={ langOptions }
					onChange={ ( { selectedItem } ) => setLang( selectedItem ) }
				/>
			</PanelRow>

			<PanelRow>
				<CustomSelectControl
					label={ __( 'Additional action', 'jetpack' ) }
					value={ action }
					options={ [
						{
							key: 'summarize',
							name: __( 'Summarize', 'jetpack' ),
						},
						{
							key: 'make-longer',
							name: __( 'Make longer', 'jetpack' ),
						},
						{
							key: 'make-shorter',
							name: __( 'Make shorter', 'jetpack' ),
						},
						{
							key: 'make-more-formal',
							name: __( 'Correct spelling and grammar', 'jetpack' ),
						},
						{
							key: 'make-more-informal',
							name: __( 'Generate a post title', 'jetpack' ),
						},
					] }
					onChange={ ( { selectedItem } ) => setAction( selectedItem ) }
				/>
			</PanelRow>
			<PanelRow>
				<ToggleControl
					label={ __( 'Combine all blocks into one', 'jetpack' ) }
					checked={ combineBlocks }
					onChange={ setCombineBlocks }
				/>
			</PanelRow>

			<PanelRow>
				<Button isPrimary onClick={ console.log( 'generate...' ) }>
					{ __( 'Generate', 'jetpack' ) }
				</Button>
			</PanelRow>
		</PanelBody>
	);
}
