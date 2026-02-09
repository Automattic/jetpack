import { describe, expect, test } from '@jest/globals';
import { getRating } from '../../../../src/modules/field-rating/helpers.js';
import {
	maybeAddColonToLabel,
	maybeTransformValue,
	getImages,
	getUrl,
} from '../../../../src/modules/form/helpers.js';

/**
 * Tests for the showPlainValue logic in form submission data formatting.
 *
 * These tests verify that the showPlainValue property is correctly computed
 * based on the presence of URL, image, and rating data, matching the logic in
 * src/modules/form/view.js setSubmissionData function.
 */
describe( 'Form View - showPlainValue computation', () => {
	/**
	 * Formats submission data for display, computing showPlainValue.
	 * This matches the logic in setSubmissionData from view.js.
	 *
	 * @param {Array} data - Array of submission data items with label and value.
	 * @return {Array} Formatted submission data with showPlainValue computed.
	 */
	const formatSubmissionData = data => {
		return data.map( item => {
			const images = getImages( item.value );
			const url = getUrl( item.value );
			const rating = getRating( item.value );

			return {
				label: maybeAddColonToLabel( item.label ),
				value: maybeTransformValue( item.value ),
				images,
				url,
				rating,
				showPlainValue: ! url && ! rating && ( ! images || images.length === 0 ),
			};
		} );
	};

	test( 'sets showPlainValue to true for plain text fields', () => {
		const testData = [
			{
				label: 'Name',
				value: 'John Doe',
			},
		];

		const result = formatSubmissionData( testData );

		expect( result[ 0 ].showPlainValue ).toBe( true );
		expect( result[ 0 ].url ).toBeNull();
		expect( result[ 0 ].images ).toBeNull();
		expect( result[ 0 ].rating ).toBeNull();
	} );

	test( 'sets showPlainValue to false for URL fields', () => {
		const testData = [
			{
				label: 'Website',
				value: {
					type: 'url',
					url: 'https://example.com',
				},
			},
		];

		const result = formatSubmissionData( testData );

		expect( result[ 0 ].showPlainValue ).toBe( false );
		expect( result[ 0 ].url ).toBe( 'https://example.com' );
	} );

	test( 'sets showPlainValue to false for image-select fields', () => {
		const testData = [
			{
				label: 'Choose Product',
				value: {
					type: 'image-select',
					choices: [
						{
							perceived: 'A',
							label: 'Shoes',
							image: { src: 'https://example.com/shoes.jpg' },
							showLabels: true,
						},
					],
				},
			},
		];

		const result = formatSubmissionData( testData );

		expect( result[ 0 ].showPlainValue ).toBe( false );
		expect( result[ 0 ].images ).toHaveLength( 1 );
	} );

	test( 'sets showPlainValue to false for rating fields', () => {
		const testData = [
			{
				label: 'Rating',
				value: {
					type: 'rating',
					rating: 4,
					maxRating: 5,
					iconStyle: 'stars',
				},
			},
		];

		const result = formatSubmissionData( testData );

		expect( result[ 0 ].showPlainValue ).toBe( false );
		expect( result[ 0 ].rating ).not.toBeNull();
		expect( result[ 0 ].rating.rating ).toBe( 4 );
	} );

	test( 'handles mixed field types correctly', () => {
		const testData = [
			{ label: 'Name', value: 'John Doe' },
			{ label: 'Website', value: { type: 'url', url: 'https://example.com' } },
			{
				label: 'Product',
				value: {
					type: 'image-select',
					choices: [
						{
							perceived: 'A',
							label: 'Shoes',
							image: { src: 'https://example.com/shoes.jpg' },
							showLabels: true,
						},
					],
				},
			},
			{
				label: 'Rating',
				value: { type: 'rating', rating: 5, maxRating: 5, iconStyle: 'stars' },
			},
		];

		const result = formatSubmissionData( testData );

		// Plain text field
		expect( result[ 0 ].showPlainValue ).toBe( true );

		// URL field
		expect( result[ 1 ].showPlainValue ).toBe( false );

		// Image-select field
		expect( result[ 2 ].showPlainValue ).toBe( false );

		// Rating field
		expect( result[ 3 ].showPlainValue ).toBe( false );
	} );

	test( 'prepends https:// to URLs without protocol', () => {
		const testData = [
			{
				label: 'Website',
				value: {
					type: 'url',
					url: 'example.com',
				},
			},
		];

		const result = formatSubmissionData( testData );

		expect( result[ 0 ].url ).toBe( 'https://example.com' );
	} );

	test( 'handles empty image-select choices', () => {
		const testData = [
			{
				label: 'Choose Product',
				value: {
					type: 'image-select',
					choices: [],
				},
			},
		];

		const result = formatSubmissionData( testData );

		// Even with empty choices, it's still an image-select field
		expect( result[ 0 ].showPlainValue ).toBe( true );
		expect( result[ 0 ].images ).toHaveLength( 0 );
	} );
} );

/**
 * Tests for the getImages helper function.
 */
describe( 'Form View - getImages helper', () => {
	test( 'returns null for plain text value', () => {
		const result = getImages( 'plain text' );
		expect( result ).toBeNull();
	} );

	test( 'returns null for URL field value', () => {
		const result = getImages( { type: 'url', url: 'https://example.com' } );
		expect( result ).toBeNull();
	} );

	test( 'extracts image data with labels when showLabels is true', () => {
		const result = getImages( {
			type: 'image-select',
			choices: [
				{
					perceived: 'A',
					label: 'Shoes',
					image: { src: 'https://example.com/shoes.jpg' },
					showLabels: true,
				},
			],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].letterCode ).toBe( 'A' );
		expect( result[ 0 ].label ).toBe( 'Shoes' );
		expect( result[ 0 ].src ).toBe( 'https://example.com/shoes.jpg' );
	} );

	test( 'returns empty label when showLabels is false', () => {
		const result = getImages( {
			type: 'image-select',
			choices: [
				{
					perceived: 'A',
					label: 'Shoes',
					image: { src: 'https://example.com/shoes.jpg' },
					showLabels: false,
				},
			],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].label ).toBe( '' );
	} );

	test( 'returns empty label when label is empty string', () => {
		const result = getImages( {
			type: 'image-select',
			choices: [
				{
					perceived: 'A',
					label: '',
					image: { src: 'https://example.com/shoes.jpg' },
					showLabels: true,
				},
			],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].label ).toBe( '' );
	} );

	test( 'returns empty label when label is null', () => {
		const result = getImages( {
			type: 'image-select',
			choices: [
				{
					perceived: 'A',
					label: null,
					image: { src: 'https://example.com/shoes.jpg' },
					showLabels: true,
				},
			],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].label ).toBe( '' );
	} );

	test( 'handles missing image src gracefully', () => {
		const result = getImages( {
			type: 'image-select',
			choices: [
				{
					perceived: 'A',
					label: 'No Image',
					showLabels: true,
				},
			],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].src ).toBe( '' );
	} );

	test( 'handles missing perceived value', () => {
		const result = getImages( {
			type: 'image-select',
			choices: [
				{
					label: 'No Letter',
					image: { src: 'https://example.com/image.jpg' },
					showLabels: true,
				},
			],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].letterCode ).toBe( '' );
	} );

	test( 'handles multiple choices with mixed showLabels', () => {
		const result = getImages( {
			type: 'image-select',
			choices: [
				{
					perceived: 'A',
					label: 'Shoes',
					image: { src: 'https://example.com/shoes.jpg' },
					showLabels: true,
				},
				{
					perceived: 'B',
					label: 'Bags',
					image: { src: 'https://example.com/bags.jpg' },
					showLabels: true,
				},
				{
					perceived: 'C',
					label: 'Hats',
					image: { src: 'https://example.com/hats.jpg' },
					showLabels: false,
				},
			],
		} );

		expect( result ).toHaveLength( 3 );

		// First choice - showLabels true
		expect( result[ 0 ].letterCode ).toBe( 'A' );
		expect( result[ 0 ].label ).toBe( 'Shoes' );

		// Second choice - showLabels true
		expect( result[ 1 ].letterCode ).toBe( 'B' );
		expect( result[ 1 ].label ).toBe( 'Bags' );

		// Third choice - showLabels false
		expect( result[ 2 ].letterCode ).toBe( 'C' );
		expect( result[ 2 ].label ).toBe( '' );
	} );
} );

/**
 * Tests for the getFiles helper function.
 */
describe( 'Form View - getFiles helper', () => {
	// Mock the capturedFilePreviews Map for testing
	const mockCapturedFilePreviews = new Map();

	// Local getFiles implementation that uses the mock Map
	const getFilesWithMock = value => {
		if ( value?.type === 'file' && value?.files ) {
			return value.files.map( file => {
				const fileName = file.name ?? '';
				const preview = mockCapturedFilePreviews.get( fileName );
				const hasPreview = !! ( preview?.previewUrl || preview?.iconUrl );

				return {
					name: fileName,
					size: file.size ?? '',
					url: file.url ?? '',
					previewUrl: preview?.previewUrl ?? null,
					iconUrl: preview?.iconUrl ?? null,
					hasPreview,
				};
			} );
		}

		return null;
	};

	beforeEach( () => {
		mockCapturedFilePreviews.clear();
	} );

	test( 'returns null for plain text value', () => {
		const result = getFilesWithMock( 'plain text' );
		expect( result ).toBeNull();
	} );

	test( 'returns null for URL field value', () => {
		const result = getFilesWithMock( { type: 'url', url: 'https://example.com' } );
		expect( result ).toBeNull();
	} );

	test( 'returns null for image-select field value', () => {
		const result = getFilesWithMock( {
			type: 'image-select',
			choices: [ { perceived: 'A' } ],
		} );
		expect( result ).toBeNull();
	} );

	test( 'extracts file data from file field value', () => {
		const result = getFilesWithMock( {
			type: 'file',
			files: [
				{
					name: 'document.pdf',
					size: '1.5 MB',
					url: 'https://example.com/download/123',
				},
			],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'document.pdf' );
		expect( result[ 0 ].size ).toBe( '1.5 MB' );
		expect( result[ 0 ].url ).toBe( 'https://example.com/download/123' );
		expect( result[ 0 ].hasPreview ).toBe( false );
	} );

	test( 'handles multiple files', () => {
		const result = getFilesWithMock( {
			type: 'file',
			files: [
				{ name: 'file1.pdf', size: '1 MB', url: 'https://example.com/1' },
				{ name: 'file2.jpg', size: '2 MB', url: 'https://example.com/2' },
				{ name: 'file3.doc', size: '500 KB', url: 'https://example.com/3' },
			],
		} );

		expect( result ).toHaveLength( 3 );
		expect( result[ 0 ].name ).toBe( 'file1.pdf' );
		expect( result[ 1 ].name ).toBe( 'file2.jpg' );
		expect( result[ 2 ].name ).toBe( 'file3.doc' );
	} );

	test( 'handles missing properties gracefully', () => {
		const result = getFilesWithMock( {
			type: 'file',
			files: [ {} ],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( '' );
		expect( result[ 0 ].size ).toBe( '' );
		expect( result[ 0 ].url ).toBe( '' );
	} );

	test( 'returns empty array for empty files array', () => {
		const result = getFilesWithMock( {
			type: 'file',
			files: [],
		} );

		expect( result ).toHaveLength( 0 );
	} );

	test( 'merges preview data when available', () => {
		mockCapturedFilePreviews.set( 'photo.jpg', {
			previewUrl: 'url(blob:http://localhost/abc123)',
			iconUrl: null,
		} );

		const result = getFilesWithMock( {
			type: 'file',
			files: [
				{
					name: 'photo.jpg',
					size: '500 KB',
					url: 'https://example.com/download/photo',
				},
			],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].previewUrl ).toBe( 'url(blob:http://localhost/abc123)' );
		expect( result[ 0 ].iconUrl ).toBeNull();
		expect( result[ 0 ].hasPreview ).toBe( true );
	} );

	test( 'sets hasPreview true when iconUrl is available', () => {
		mockCapturedFilePreviews.set( 'document.pdf', {
			previewUrl: null,
			iconUrl: 'url(http://localhost/icons/pdf.svg)',
		} );

		const result = getFilesWithMock( {
			type: 'file',
			files: [
				{
					name: 'document.pdf',
					size: '1 MB',
					url: 'https://example.com/download/doc',
				},
			],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].previewUrl ).toBeNull();
		expect( result[ 0 ].iconUrl ).toBe( 'url(http://localhost/icons/pdf.svg)' );
		expect( result[ 0 ].hasPreview ).toBe( true );
	} );

	test( 'sets hasPreview false when no preview data captured', () => {
		const result = getFilesWithMock( {
			type: 'file',
			files: [
				{
					name: 'uncaptured.pdf',
					size: '1 MB',
					url: 'https://example.com/download/uncaptured',
				},
			],
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].previewUrl ).toBeNull();
		expect( result[ 0 ].iconUrl ).toBeNull();
		expect( result[ 0 ].hasPreview ).toBe( false );
	} );
} );

/**
 * Tests for the getUrl helper function.
 */
describe( 'Form View - getUrl helper', () => {
	test( 'returns null for plain text value', () => {
		const result = getUrl( 'plain text' );
		expect( result ).toBeNull();
	} );

	test( 'returns null for image-select field', () => {
		const result = getUrl( {
			type: 'image-select',
			choices: [ { perceived: 'A' } ],
		} );
		expect( result ).toBeNull();
	} );

	test( 'returns URL for URL field with https protocol', () => {
		const result = getUrl( { type: 'url', url: 'https://example.com' } );
		expect( result ).toBe( 'https://example.com' );
	} );

	test( 'returns URL for URL field with http protocol', () => {
		const result = getUrl( { type: 'url', url: 'http://example.com' } );
		expect( result ).toBe( 'http://example.com' );
	} );

	test( 'prepends https:// when no protocol specified', () => {
		const result = getUrl( { type: 'url', url: 'example.com' } );
		expect( result ).toBe( 'https://example.com' );
	} );

	test( 'returns null when URL is empty', () => {
		const result = getUrl( { type: 'url', url: '' } );
		expect( result ).toBeNull();
	} );

	test( 'returns null when URL is missing', () => {
		const result = getUrl( { type: 'url' } );
		expect( result ).toBeNull();
	} );
} );

/**
 * Tests for the getRating helper function.
 */
describe( 'Form View - getRating helper', () => {
	test( 'returns null for plain text value', () => {
		const result = getRating( 'plain text' );
		expect( result ).toBeNull();
	} );

	test( 'returns null for URL field', () => {
		const result = getRating( { type: 'url', url: 'https://example.com' } );
		expect( result ).toBeNull();
	} );

	test( 'returns null for image-select field', () => {
		const result = getRating( {
			type: 'image-select',
			choices: [ { perceived: 'A' } ],
		} );
		expect( result ).toBeNull();
	} );

	test( 'extracts rating data for rating field', () => {
		const result = getRating( {
			type: 'rating',
			rating: 4,
			maxRating: 5,
			iconStyle: 'stars',
		} );

		expect( result ).not.toBeNull();
		expect( result.rating ).toBe( 4 );
		expect( result.maxRating ).toBe( 5 );
		expect( result.iconStyle ).toBe( 'stars' );
	} );

	test( 'uses default values for missing properties', () => {
		const result = getRating( { type: 'rating' } );

		expect( result ).not.toBeNull();
		expect( result.rating ).toBe( 0 );
		expect( result.maxRating ).toBe( 5 );
		expect( result.iconStyle ).toBe( 'stars' );
	} );

	test( 'handles hearts icon style', () => {
		const result = getRating( {
			type: 'rating',
			rating: 3,
			maxRating: 5,
			iconStyle: 'hearts',
		} );

		expect( result.iconStyle ).toBe( 'hearts' );
	} );
} );
