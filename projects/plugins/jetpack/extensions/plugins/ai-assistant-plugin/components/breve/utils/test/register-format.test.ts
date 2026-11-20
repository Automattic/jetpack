import { registerFormatType } from '@wordpress/rich-text';
import { registerBreveHighlights } from '../register-format';

let mockWriteBriefAvailable = true;

jest.mock( '../../../../../../blocks/ai-assistant/lib/utils/get-feature-availability', () => ( {
	// The AI extension stays available throughout: only Write Brief's own flag moves.
	getFeatureAvailability: ( feature: string ) =>
		feature === 'ai-proofread-breve' ? mockWriteBriefAvailable : true,
} ) );

jest.mock( '@wordpress/rich-text', () => ( {
	registerFormatType: jest.fn(),
	removeFormat: jest.fn(),
} ) );

jest.mock( '@wordpress/blocks', () => ( { getBlockContent: () => '' } ) );
jest.mock( '@wordpress/data', () => ( {
	select: () => ( {} ),
	dispatch: () => ( {} ),
} ) );
jest.mock( 'md5', () => () => 'hash' );
jest.mock( '../../features', () => [
	{ highlight: jest.fn(), config: { name: 'spelling-mistakes', title: 'Spelling' } },
	{ highlight: jest.fn(), config: { name: 'long-sentences', title: 'Long' } },
] );
jest.mock( '../../features/events', () => jest.fn() );
jest.mock( '../../highlight/highlight', () => jest.fn() );
jest.mock( '../../store', () => ( { store: 'jetpack/breve' } ) );
jest.mock( '../get-availability', () => ( {
	getBreveAvailability: () => true,
	canWriteBriefBeEnabled: () => true,
	canWriteBriefFeatureBeEnabled: () => true,
} ) );

describe( 'registerBreveHighlights', () => {
	beforeEach( () => {
		( registerFormatType as jest.Mock ).mockClear();
		mockWriteBriefAvailable = true;
	} );

	// Registered format types are consulted by every RichText render, and that is
	// what reaches the AI feature endpoint.
	it( 'registers no format types when Write Brief is unavailable', () => {
		mockWriteBriefAvailable = false;

		registerBreveHighlights();

		expect( registerFormatType ).not.toHaveBeenCalled();
	} );

	it( 'registers one format type per feature when Write Brief is available', () => {
		registerBreveHighlights();

		expect( registerFormatType ).toHaveBeenCalledTimes( 2 );
	} );
} );
