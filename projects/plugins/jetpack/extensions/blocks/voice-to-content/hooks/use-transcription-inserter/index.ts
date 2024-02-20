/**
 * External dependencies
 */
import { rawHandler } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import debugFactory from 'debug';
import MarkdownIt from 'markdown-it';

const debug = debugFactory( 'voice-to-content:use-transcription-inserter' );

/**
 * The return value for the transcription inserter hook.
 */
export type UseTranscriptionInserterReturn = {
	upsertTranscription: ( transcription: string ) => void;
};

/**
 * Create a new markdown converter
 */
const markdownConverter = new MarkdownIt( {
	breaks: true,
} );

/**
 * Hook to handle the insertion of the transcription into the editor.
 *
 * @returns {UseTranscriptionInserterReturn} - Object with function to handle transcription upserting.
 */
export default function useTranscriptionInserter(): UseTranscriptionInserterReturn {
	const { updateBlockAttributes, insertBlock, replaceInnerBlocks } =
		useDispatch( 'core/block-editor' );

	/*
	 * List of blocks currently on the editor.
	 */
	const currentBlocks = useRef( [] );

	const upsertTranscription = useCallback(
		( transcription: string ) => {
			debug( 'Upserting transcription' );

			/*
			 * Convert the markdown to HTML
			 */
			const html = markdownConverter
				.render( transcription || '' )
				// Fix list indentation
				.replace( /<li>\s+<p>/g, '<li>' )
				.replace( /<\/p>\s+<\/li>/g, '</li>' );

			/*
			 * Parse the HTML into blocks
			 */
			const blocksFromHTML = rawHandler( { HTML: html } );

			/*
			 * Go through the blocks and update or insert them
			 */
			for ( let i = 0; i < blocksFromHTML.length; i++ ) {
				/*
				 * If the block is already there, update its content
				 */
				if ( i < currentBlocks.current.length ) {
					const currentblockClientId = currentBlocks.current[ i ].clientId;
					const currentBlockContent = currentBlocks.current[ i ].attributes.content;

					/*
					 * If the block has content, update it
					 */
					if (
						blocksFromHTML[ i ].attributes?.content &&
						currentBlockContent !== blocksFromHTML[ i ].attributes?.content
					) {
						updateBlockAttributes( currentblockClientId, {
							content: blocksFromHTML[ i ].attributes.content,
						} );
					}

					/*
					 * If the block has inner blocks, update them
					 */
					if ( blocksFromHTML[ i ].innerBlocks.length > 0 ) {
						replaceInnerBlocks( currentblockClientId, blocksFromHTML[ i ].innerBlocks );
					}
				} else {
					/*
					 * The block is not there, insert it
					 */
					insertBlock( blocksFromHTML[ i ] );

					/*
					 * Append the new block to the list of current blocks
					 */
					currentBlocks.current.push( blocksFromHTML[ i ] );
				}
			}
		},
		[ currentBlocks, insertBlock, updateBlockAttributes, replaceInnerBlocks ]
	);

	return {
		upsertTranscription,
	};
}
