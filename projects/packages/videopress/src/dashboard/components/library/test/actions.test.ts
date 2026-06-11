import { buildLibraryActions } from '../actions';
import type { LibraryItem } from '../../../types/library';

const item = ( overrides: Partial< LibraryItem > = {} ): LibraryItem => ( {
	id: '42',
	guid: 'abc123',
	type: 'videopress',
	title: 'My Clip',
	filename: 'clip.mp4',
	thumbnailUrl: null,
	durationSeconds: 0,
	uploadDate: '2026-01-01T00:00:00',
	privacy: 'public',
	isPrivate: false,
	fileSizeBytes: 0,
	upload: { status: 'idle', progress: 0 },
	description: '',
	rating: 'G',
	displayEmbed: true,
	allowDownloads: false,
	shortcode: '',
	isProcessing: false,
	...overrides,
} );

const makeApi = () => ( {
	promoteLocal: jest.fn(),
	retryUpload: jest.fn(),
	deleteItems: jest.fn(),
	setPrivacy: jest.fn(),
	openVideoDetails: jest.fn(),
} );

describe( 'buildLibraryActions — eligibility while deleting', () => {
	it( 'makes a row with a delete in flight ineligible for every action', () => {
		const actions = buildLibraryActions( makeApi() );
		const deleting = item( { upload: { status: 'deleting', progress: 0 } } );

		for ( const action of actions ) {
			expect( { id: action.id, eligible: action.isEligible?.( deleting ) } ).toEqual( {
				id: action.id,
				eligible: false,
			} );
		}
	} );

	it( 'keeps an idle VideoPress row eligible for delete and edit', () => {
		const actions = buildLibraryActions( makeApi() );
		const idle = item();

		expect( actions.find( a => a.id === 'delete' )?.isEligible?.( idle ) ).toBe( true );
		expect( actions.find( a => a.id === 'edit-details' )?.isEligible?.( idle ) ).toBe( true );
	} );
} );
