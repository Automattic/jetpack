/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	PanelBody,
	PanelRow,
	CustomSelectControl,
	ToggleControl,
	Button,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import { buildPromptTemplate } from '../../create-prompt';
import { askQuestion } from '../../get-suggestion-with-stream';
import { LANGUAGE_MAP, defaultLanguage } from '../../i18n-dropdown-control';
import { DEFAULT_PROMPT_TONE, PROMPT_TONES_MAP, ToneProp } from '../../tone-dropdown-control';

// Create a Tone Array of objects with `key` and `name` keys
export const toneOptions = Object.keys( PROMPT_TONES_MAP ).map( key => {
	return {
		key,
		name: `${ PROMPT_TONES_MAP[ key ].emoji } ${ PROMPT_TONES_MAP[ key ].label }`,
	};
} );
const defaultTone = toneOptions.find( option => option.key === DEFAULT_PROMPT_TONE );

// Create a Language Array of objects with `key` and `name` keys
export const langOptions = Object.keys( LANGUAGE_MAP ).map( key => {
	return {
		key,
		name: LANGUAGE_MAP[ key ].label,
	};
} );
const defaultLang = langOptions.find( option => option.key === defaultLanguage );

/**
 * Hola
 *
 * @param {object}   props           - Component props
 * @param {string[]} props.blocksIds - Blocks to generate content from
 * @returns {React.ReactElement}       The component's elements.
 */
export default function GenerateContentPanel( { blocksIds } ) {
	const [ tone, setTone ] = useState( defaultTone );
	const [ lang, setLang ] = useState( defaultLang );
	const [ action, setAction ] = useState< { key: ToneProp; name: string; prompt: string } >( {
		key: 'formal',
		name: __( 'Summarize', 'jetpack' ),
		prompt: '',
	} );

	const [ combineBlocks, setCombineBlocks ] = useState( false );

	const { replaceBlocks, updateBlockAttributes, insertBlock } = useDispatch( blockEditorStore );

	const blocks = useSelect(
		select => {
			const { getBlocksByClientId } = select( blockEditorStore );
			return getBlocksByClientId( blocksIds );
		},
		[ blocksIds ]
	);

	const lastBlockIndex = useSelect(
		select => {
			const { getBlockIndex } = select( blockEditorStore );
			return getBlockIndex( blocksIds[ blocksIds.length - 1 ] );
		},
		[ blocksIds ]
	);

	const getContentFromSelectedBlocks = useCallback( () => {
		return blocks
			.map( block => {
				return block.attributes.content;
			} )
			.join( '\n' );
	}, [ blocks ] );

	const generateContent = useCallback( async () => {
		// Prompt content
		const content = getContentFromSelectedBlocks();

		let request = 'Please help me combine the content belog into a single, coherent text.';
		if ( tone?.key ) {
			request += ` Write with a \`${ tone.key }\` tone.`;
		}

		if ( lang?.key ) {
			request += ` Write in \`${ lang.key }\` - (${ LANGUAGE_MAP[ lang.key ].label }) language.`;
		}

		if ( action?.key ) {
			request += ' ' + action.prompt;
		}

		const prompt = buildPromptTemplate( {
			request,
			content,
		} );

		let source: EventSource;
		try {
			source = await askQuestion( prompt );
		} catch ( error ) {
			return;
		}

		let fullMessage = '';

		const generatedBlock = createBlock( 'core/paragraph', {
			content: '',
		} );

		if ( combineBlocks ) {
			replaceBlocks( blocksIds, [ generatedBlock ] );
		} else {
			insertBlock( generatedBlock, lastBlockIndex + 1 );
		}

		source.addEventListener( 'message', e => {
			if ( e.data === '[DONE]' ) {
				source.close();
				return;
			}

			const data = JSON.parse( e.data );
			const chunk = data.choices[ 0 ].delta.content;
			if ( chunk ) {
				fullMessage += chunk;
				updateBlockAttributes( generatedBlock.clientId, {
					content: fullMessage,
				} );
			}
		} );
	}, [
		getContentFromSelectedBlocks,
		tone?.key,
		lang?.key,
		action,
		combineBlocks,
		replaceBlocks,
		blocksIds,
		insertBlock,
		lastBlockIndex,
		updateBlockAttributes,
	] );

	return (
		<PanelBody
			title={ __( 'Ask Assistant to edit', 'jetpack' ) }
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
							prompt: 'Finally, please, summarize the content.',
						},
						{
							key: 'make-longer',
							name: __( 'Make longer', 'jetpack' ),
							prompt: 'Finally, please, make the content longer.',
						},
						{
							key: 'make-shorter',
							name: __( 'Make shorter', 'jetpack' ),
							prompt: 'Finally, please, make the content shorter.',
						},
						{
							key: 'spelling-and-grammar',
							name: __( 'Correct spelling and grammar', 'jetpack' ),
							prompt: 'Finally, please, correct spelling and grammar of the content.',
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
				<Button variant="primary" onClick={ generateContent }>
					{ __( 'Generate', 'jetpack' ) }
				</Button>
			</PanelRow>
		</PanelBody>
	);
}
