import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AD_FORMATS, DEFAULT_FORMAT } from '../constants';
import WordAdsEdit from '../edit';
import wideSkyscraperExample from '../example_160x600.png';
import rectangleExample from '../example_300x250.png';
import mobileLeaderboardExample from '../example_320x50.png';
import leaderboardExample from '../example_728x90.png';

jest.mock( '@automattic/jetpack-shared-extension-utils' );

describe( 'WordAdsEdit', () => {
	const moduleStatus = {
		isModuleActive: true,
		changeStatus: jest.fn(),
	};
	beforeEach( () => {
		useModuleStatus.mockReturnValue( { ...moduleStatus } );
	} );
	afterEach( () => {
		jest.clearAllMocks();
	} );

	const defaultAttributes = { format: DEFAULT_FORMAT };
	const defaultProps = { attributes: defaultAttributes };

	const getFormat = format => AD_FORMATS.find( ( { tag } ) => tag === format );

	const renderWordAdsEdit = props => {
		const { container } = render( <WordAdsEdit { ...props } /> );

		// eslint-disable-next-line testing-library/no-node-access,testing-library/no-container
		return container.querySelector( '.jetpack-wordads__ad' );
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

	test( 'matches snapshot', () => {
		const { container } = render( <WordAdsEdit { ...defaultProps } /> );

		expect( container ).toMatchSnapshot( 'WordAdsEdit' );
	} );

	test( 'renders ad placeholder with correct css class and styles', () => {
		// eslint-disable-next-line testing-library/render-result-naming-convention -- False positive.
		const placeholder = renderWordAdsEdit( defaultProps );
		const selectedFormat = getFormat( defaultAttributes.format );

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

	test( 'renders placeholder and activates the plugin', async () => {
		useModuleStatus.mockReturnValue( { ...moduleStatus, isModuleActive: false } );
		render( <WordAdsEdit { ...defaultProps } /> );

		const activateButton = screen.getByText( 'Activate WordAds' );
		await userEvent.click( activateButton );
		expect( moduleStatus.changeStatus ).toHaveBeenCalled();
	} );
} );
