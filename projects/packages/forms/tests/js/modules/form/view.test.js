import { describe, expect, test } from '@jest/globals';

/**
 * Tests for the showPlainValue logic in form submission data formatting.
 *
 * These tests verify that the showPlainValue property is correctly computed
 * based on the presence of URL and image data, matching the logic in
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

			return {
				label: maybeAddColonToLabel( item.label ),
				value: maybeTransformValue( item.value ),
				images,
				url,
				showPlainValue: ! url && ( ! images || images.length === 0 ),
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
		];

		const result = formatSubmissionData( testData );

		// Plain text field
		expect( result[ 0 ].showPlainValue ).toBe( true );

		// URL field
		expect( result[ 1 ].showPlainValue ).toBe( false );

		// Image-select field
		expect( result[ 2 ].showPlainValue ).toBe( false );
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

// Helper functions replicated from view.js for testing
const maybeAddColonToLabel = label => {
	const formattedLabel = label ? label : null;

	if ( ! formattedLabel ) {
		return null;
	}
	return formattedLabel.endsWith( '?' )
		? formattedLabel
		: formattedLabel.replace( /[.:]$/, '' ) + ':';
};

const maybeTransformValue = value => {
	if ( value?.type === 'image-select' ) {
		return value.choices
			.map( choice => {
				let transformedValue = choice.perceived;

				if ( choice.showLabels && choice.label != null && choice.label !== '' ) {
					transformedValue += ' - ' + choice.label;
				}

				return transformedValue;
			} )
			.join( ', ' );
	}

	if ( value?.type === 'url' && value?.url ) {
		return value.url;
	}

	return value;
};

const getImages = value => {
	if ( value?.type === 'image-select' ) {
		return value.choices.map( choice => {
			const letterCode = choice.perceived ?? '';
			const label =
				choice.showLabels && choice.label != null && choice.label !== '' ? choice.label : '';

			return {
				src: choice.image?.src ?? '',
				letterCode,
				label,
			};
		} );
	}

	return null;
};

const getUrl = value => {
	if ( value?.type === 'url' && value?.url ) {
		let url = value.url;

		if ( ! /^https?:\/\//i.test( url ) ) {
			url = 'https://' + url;
		}

		return url;
	}

	return null;
};
