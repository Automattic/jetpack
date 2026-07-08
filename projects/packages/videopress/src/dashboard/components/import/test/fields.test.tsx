import { render, screen } from '@testing-library/react';
import { importPickerFields, IMPORT_PRIVACY_LABELS } from '../fields';
import type { YouTubeVideo, YouTubeVideoPrivacy } from '../../../hooks/use-youtube-videos';
import type { ComponentType } from 'react';

const makeVideo = ( overrides: Partial< YouTubeVideo > = {} ): YouTubeVideo => ( {
	externalId: 'yt-1',
	title: 'First video',
	description: '',
	tags: [],
	durationSeconds: 65,
	privacy: 'public',
	publishedAt: '2026-01-01T00:00:00Z',
	thumbnailUrl: 'https://example.com/1.jpg',
	alreadyImported: false,
	attachmentId: null,
	...overrides,
} );

const getField = ( id: string ) => {
	const field = importPickerFields.find( candidate => candidate.id === id );
	if ( ! field ) {
		throw new Error( `missing field: ${ id }` );
	}
	return field;
};

const renderField = ( id: string, item: YouTubeVideo ) => {
	const Render = getField( id ).render as ComponentType< { item: YouTubeVideo } >;
	return render( <Render item={ item } /> );
};

describe( 'importPickerFields — title', () => {
	it( 'renders the title without a badge for a not-yet-imported video', () => {
		renderField( 'title', makeVideo() );

		expect( screen.getByText( 'First video' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Already imported' ) ).not.toBeInTheDocument();
	} );

	it( 'renders an "Already imported" badge when a draft already exists', () => {
		renderField( 'title', makeVideo( { alreadyImported: true, attachmentId: 12 } ) );

		expect( screen.getByText( 'First video' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Already imported' ) ).toBeInTheDocument();
	} );
} );

describe( 'importPickerFields — thumbnail', () => {
	it( 'renders the thumbnail image with the title as alt text', () => {
		renderField( 'thumbnail', makeVideo() );

		expect( screen.getByRole( 'img', { name: 'First video' } ) ).toHaveAttribute(
			'src',
			'https://example.com/1.jpg'
		);
	} );

	it( 'renders no image when there is no thumbnail', () => {
		renderField( 'thumbnail', makeVideo( { thumbnailUrl: null } ) );

		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'importPickerFields — duration and privacy', () => {
	it( 'formats the duration as mm:ss', () => {
		renderField( 'duration', makeVideo( { durationSeconds: 65 } ) );

		expect( screen.getByText( '01:05' ) ).toBeInTheDocument();
	} );

	it.each( Object.entries( IMPORT_PRIVACY_LABELS ) as [ YouTubeVideoPrivacy, string ][] )(
		'labels %s privacy as %s',
		( privacy, label ) => {
			renderField( 'privacy', makeVideo( { privacy } ) );

			expect( screen.getByText( label ) ).toBeInTheDocument();
		}
	);

	it( 'disables sorting and filtering on every field (no server-side mapping)', () => {
		for ( const field of importPickerFields ) {
			expect( field.enableSorting ).toBe( false );
		}
	} );
} );
