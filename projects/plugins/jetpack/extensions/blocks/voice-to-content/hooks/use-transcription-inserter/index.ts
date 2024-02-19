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
	const { replaceBlocks, insertBlocks } = useDispatch( 'core/block-editor' );

	/*
	 * List of blocks currently on the editor.
	 */
	const currentBlocks = useRef( [] );

	const upsertTranscription = useCallback(
		( transcription: string ) => {
			debug( 'Upserting transcription' );

			// Convert the markdown to HTML
			const html = markdownConverter
				.render( transcription || '' )
				// Fix list indentation
				.replace( /<li>\s+<p>/g, '<li>' )
				.replace( /<\/p>\s+<\/li>/g, '</li>' );

			// Parse the HTML into blocks
			const blocksFromHTML = rawHandler( { HTML: html } );

			/*
			 * Replace the current blocks with the new ones
			 */
			if ( blocksFromHTML.length > 0 ) {
				if ( currentBlocks.current.length === 0 ) {
					insertBlocks( blocksFromHTML );
					currentBlocks.current = blocksFromHTML;
				} else {
					replaceBlocks(
						currentBlocks.current.map( b => b.clientId ),
						blocksFromHTML
					);
					currentBlocks.current = blocksFromHTML;
				}
			}
		},
		[ currentBlocks, insertBlocks, replaceBlocks ]
	);

	return {
		upsertTranscription,
	};
}
