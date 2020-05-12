/**
 * External dependencies
 */
import { find, get, reject } from 'lodash';

/**
 * WordPress dependencies
 */
import { parse, serialize } from '@wordpress/blocks';
import { useEffect } from '@wordpress/element';

export default function useEditorNotesMeta( attributes, setAttributes ) {
	const { notes, noteId } = attributes;

	useEffect( () => {
		if ( noteId ) {
			return;
		}
		setAttributes( { noteId: Date.now() } );
	}, [ noteId, setAttributes ] );

	const setNotes = blocks => {
		const newNotes = [
			...reject( notes, { id: noteId } ),
			{
				id: noteId,
				blocks: serialize( blocks ),
			},
		];
		setAttributes( { notes: newNotes } );
	};

	const noteBlocks = get( find( notes, { id: noteId } ), 'blocks', '' );
	const parsedBlocks = parse( noteBlocks );

	return { parsedBlocks, setNotes };
}
