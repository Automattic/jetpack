import { act } from '@testing-library/react';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch } from '@wordpress/data';
import {
	clientId,
	getBlockAttributes,
	isSavingLocked,
	makeFiles,
	reportEachFile,
	uploadFiles,
} from '../../../shared/test/upload-files';
import Edit from '../edit';

const uploadToStory = ( mediaFiles, files ) =>
	uploadFiles( { Edit, name: 'jetpack/story', attributes: { mediaFiles }, files } );

test.each( [
	[ 'an empty story', [], [ 10, 11, 12, 13 ] ],
	[ 'a story with media', [ { id: 1, url: 'http://example.com/1.jpg' } ], [ 1, 10, 11, 12, 13 ] ],
] )(
	'keeps every file uploaded into %s when uploads report one file at a time',
	async ( _, mediaFiles, expectedIds ) => {
		reportEachFile( await uploadToStory( mediaFiles, makeFiles( [ 'a', 'b', 'c', 'd' ] ) ) );

		expect( getBlockAttributes().mediaFiles.map( ( { id } ) => id ) ).toEqual( expectedIds );
	}
);

test( 'releases the save lock when the block is removed mid-upload', async () => {
	await uploadToStory( [], makeFiles( [ 'a', 'b' ] ) );
	expect( isSavingLocked() ).toBe( true );

	act( () => {
		dispatch( blockEditorStore ).removeBlock( clientId );
	} );
	expect( isSavingLocked() ).toBe( false );
} );
