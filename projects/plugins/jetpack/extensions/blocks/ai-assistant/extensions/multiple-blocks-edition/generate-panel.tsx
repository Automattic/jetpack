/**
 * External dependencies
 */
import { store as blockEditorStore, BlockIcon } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	PanelBody,
	PanelRow,
	CustomSelectControl,
	ToggleControl,
	Button,
	Notice,
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
import { LANGUAGE_MAP } from '../../i18n-dropdown-control';
import Icon from '../../icon';
import { PROMPT_TONES_MAP } from '../../tone-dropdown-control';

// Create a Tone Array of objects with `key` and `name` keys
export const toneOptions = Object.keys( PROMPT_TONES_MAP ).map( key => {
	return {
		key,
		name: `${ PROMPT_TONES_MAP[ key ].emoji } ${ PROMPT_TONES_MAP[ key ].label }`,
	};
} );

// Create a Language Array of objects with `key` and `name` keys
export const langOptions = Object.keys( LANGUAGE_MAP ).map( key => {
	return {
		key,
		name: LANGUAGE_MAP[ key ].label,
	};
} );

/**
 * Block edit panel to generate content from multiple blocks.
 *
 * @param {object}   props           - Component props
 * @param {string[]} props.blocksIds - Blocks to generate content from
 * @returns {React.ReactElement}       The component's elements.
 */
export default function GenerateContentPanel( { blocksIds } ) {
	const [ tone, setTone ] = useState( {
		key: '',
		name: '',
	} );
	const [ lang, setLang ] = useState( {
		key: '',
		name: '',
	} );

	const [ action, setAction ] = useState< {
		key: 'summarize' | 'make-longer' | 'make-shorter' | 'spelling-and-grammar' | '';
		name: string;
		prompt: string;
	} >( {
		key: '',
		name: '',
		prompt: '',
	} );

	const [ combineBlocks, setCombineBlocks ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( '' );
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
		const content = getContentFromSelectedBlocks();
		const rules: string[] = [];

		if ( tone.key.length ) {
			rules.push( `Set the tone to \`${ tone.key }\`` );
		}

		if ( lang.key.length ) {
			rules.push(
				`Translate the content to \`${ lang.key }\` (${ LANGUAGE_MAP[ lang.key ].label })`
			);
		}

		if ( action.key.length ) {
			rules.push( action.prompt );
		}

		const prompt = buildPromptTemplate( {
			content,
			rules,
		} );

		let source: EventSource;
		try {
			source = await askQuestion( prompt );
			setErrorMessage( '' );
		} catch ( error ) {
			return;
		}

		const generatedBlock = createBlock( 'jetpack/ai-assistant', {
			content: '',
		} );

		let newBlockJustCreated = false;

		source.addEventListener( 'done', () => {
			source.close();
		} );

		source.addEventListener( 'error_unclear_prompt', () => {
			setErrorMessage( __( 'Your request was unclear. Mind trying again?', 'jetpack' ) );
			source.close();
		} );

		source.addEventListener( 'suggestion', e => {
			if ( ! newBlockJustCreated ) {
				if ( combineBlocks ) {
					replaceBlocks( blocksIds, [ generatedBlock ] );
				} else {
					insertBlock( generatedBlock, lastBlockIndex + 1 );
				}
				newBlockJustCreated = true;
			}

			updateBlockAttributes( generatedBlock.clientId, {
				content: e.detail as string,
			} );
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
			title={ __( 'AI Assistant', 'jetpack' ) }
			className="jetpack-ai-assistant__multiple-blocks-edition-panel"
			icon={ <BlockIcon icon={ Icon } /> }
		>
			<PanelRow>
				<CustomSelectControl
					label={ __( 'Tone', 'jetpack' ) }
					value={ tone }
					options={ toneOptions }
					onChange={ ( { selectedItem } ) => setTone( selectedItem ) }
				/>
			</PanelRow>

			<PanelRow>
				<CustomSelectControl
					label={ __( 'Language', 'jetpack' ) }
					value={ lang }
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
							prompt: 'Summarize the content',
						},
						{
							key: 'make-longer',
							name: __( 'Make longer', 'jetpack' ),
							prompt: 'Make the content longer',
						},
						{
							key: 'make-shorter',
							name: __( 'Make shorter', 'jetpack' ),
							prompt: 'Make the content shorter',
						},
						{
							key: 'spelling-and-grammar',
							name: __( 'Correct spelling and grammar', 'jetpack' ),
							prompt: 'Correct spelling and grammar of the content',
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
				<Button
					variant="primary"
					onClick={ generateContent }
					disabled={ ! ( tone.key.length + lang.key.length + action.prompt.length ) }
				>
					{ __( 'Generate', 'jetpack' ) }
				</Button>
			</PanelRow>

			{ !! errorMessage.length && (
				<PanelRow>
					<Notice status="warning" isDismissible={ false } className="jetpack-ai-assistant__error">
						{ errorMessage }
					</Notice>
				</PanelRow>
			) }
		</PanelBody>
	);
}
