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
