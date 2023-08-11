import { render } from '@testing-library/react';
import { AD_FORMATS, DEFAULT_FORMAT } from '../constants';
import WordAdsEdit from '../edit';
import wideSkyscraperExample from '../example_160x600.png';
import rectangleExample from '../example_300x250.png';
import mobileLeaderboardExample from '../example_320x50.png';
import leaderboardExample from '../example_728x90.png';

describe( 'WordAdsEdit', () => {
	const defaultAttributes = { format: DEFAULT_FORMAT };
	const defaultProps = { attributes: defaultAttributes };

	const getFormat = format => AD_FORMATS.find( ( { tag } ) => tag === format );

	const renderWordAdsEdit = props => {
		const { container } = render( <WordAdsEdit { ...props } /> );

		// eslint-disable-next-line testing-library/no-node-access
		return container.firstChild.firstChild;
	};

	// Renders the component, extracting the inner placeholder element and finding
	// selected format object styles are created from.
	const renderFormatted = format => {
		// eslint-disable-next-line testing-library/render-result-naming-convention -- False positive.
		const placeholder = renderWordAdsEdit( {
			...defaultProps,
			attributes: { format },
		} );
		const selectedFormat = getFormat( format );

		return { placeholder, selectedFormat };
	};

	test( 'renders wrapper with correct css class', () => {
		const { container } = render( <WordAdsEdit { ...defaultProps } /> );

		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild ).toHaveClass( 'wp-block-jetpack-wordads' );
		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild ).toHaveClass( `jetpack-wordads-${ defaultAttributes.format }` );
	} );

	test( 'renders ad placeholder with correct css class and styles', () => {
		// eslint-disable-next-line testing-library/render-result-naming-convention -- False positive.
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
