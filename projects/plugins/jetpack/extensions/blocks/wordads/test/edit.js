/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import WordAdsEdit from '../edit';
import { AD_FORMATS, DEFAULT_FORMAT } from '../constants';

/**
 * Example images
 */
import rectangleExample from '../example_300x250.png';
import leaderboardExample from '../example_728x90.png';
import mobileLeaderboardExample from '../example_320x50.png';
import wideSkyscraperExample from '../example_160x600.png';

describe( 'WordAdsEdit', () => {
	const defaultAttributes = { format: DEFAULT_FORMAT };
	const defaultProps = { attributes: defaultAttributes };

	const getFormat = format => AD_FORMATS.find( ( { tag } ) => tag === format );

	const renderWordAdsEdit = ( props ) => {
		const { container } = render( <WordAdsEdit { ...props } /> );

		return container.firstChild.firstChild;
	};

	// Renders the component, extracting the inner placeholder element and finding
	// selected format object styles are created from.
	const renderFormatted = ( format ) => {
		const placeholder = renderWordAdsEdit( {
			...defaultProps,
			attributes: { format }
		} );
		const selectedFormat = getFormat( format );

		return { placeholder, selectedFormat };
	};

	test( 'renders wrapper with correct css class', () => {
		const { container } = render( <WordAdsEdit { ...defaultProps } /> );

		expect( container.firstChild ).toHaveClass( 'wp-block-jetpack-wordads' );
		expect( container.firstChild ).toHaveClass( `jetpack-wordads-${ defaultAttributes.format }` );
	} );

	test( 'renders ad placeholder with correct css class and styles', () => {
		const placeholder = renderWordAdsEdit( defaultProps );
		const selectedFormat = getFormat( defaultAttributes.format );

		expect( placeholder ).toHaveClass( 'jetpack-wordads__ad' );
		expect( placeholder ).toHaveStyle( `width: ${ selectedFormat.width }px` );
		expect( placeholder ).toHaveStyle( `height: ${ selectedFormat.height }px` );
		expect( placeholder ).toHaveStyle( `backgroundImage: url( ${ rectangleExample } )` );
		expect( placeholder ).toHaveStyle( `backgroundSize: cover` );
	} );

	test( 'renders leaderboard format correctly', () => {
		const { placeholder, selectedFormat } = renderFormatted( 'leaderboard' );

		expect( placeholder ).toHaveStyle( `width: ${ selectedFormat.width }px` );
		expect( placeholder ).toHaveStyle( `height: ${ selectedFormat.height }px` );
		expect( placeholder ).toHaveStyle( `backgroundImage: url( ${ leaderboardExample } )` );
	} );

	test( 'renders mobile_leaderboard format correctly', () => {
		const { placeholder, selectedFormat } = renderFormatted( 'mobile_leaderboard' );

		expect( placeholder ).toHaveStyle( `width: ${ selectedFormat.width }px` );
		expect( placeholder ).toHaveStyle( `height: ${ selectedFormat.height }px` );
		expect( placeholder ).toHaveStyle( `backgroundImage: url( ${ mobileLeaderboardExample } )` );
	} );

	test( 'renders wideskyscraper format correctly', () => {
		const { placeholder, selectedFormat } = renderFormatted( 'wideskyscraper' );

		expect( placeholder ).toHaveStyle( `width: ${ selectedFormat.width }px` );
		expect( placeholder ).toHaveStyle( `height: ${ selectedFormat.height }px` );
		expect( placeholder ).toHaveStyle( `backgroundImage: url( ${ wideSkyscraperExample } )` );
	} );
} );
