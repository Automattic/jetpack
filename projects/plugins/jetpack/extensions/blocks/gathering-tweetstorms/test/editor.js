import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import addTweetstormToTweets from '../editor';

jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn() );

// Fake <BlockControls> so we can easily test if it was inserted or not.
jest.mock( '@wordpress/block-editor/build/components/block-controls', () => ( {
	__esModule: true,
	default: () => <div data-testid="BlockControls">BlockControls</div>,
} ) );

useSelect.mockImplementation( cb => {
	return cb( () => ( {
		getEditedPostAttribute: () => ( {} ),
		isFirstMultiSelectedBlock: jest.fn().mockReturnValueOnce( true ),
		getMultiSelectedBlockClientIds: () => [],
		getBlockName: () => 'DaName',
	} ) );
} );

describe( 'addTweetstormToTweets', () => {
	const baseEditFunction = () => {
		return <div id="baseEdit">Base Edit </div>;
	};

	it( 'should expose the function', () => {
		expect( addTweetstormToTweets ).toBeDefined();
	} );

	it( 'should not add the wrapper when passed a deprecated block definition', () => {
		const block = {
			isDeprecation: true,
			edit: baseEditFunction,
		};

		const wrappedBlock = addTweetstormToTweets( block );

		expect( wrappedBlock ).toEqual( block );
	} );

	it( 'should not add the wrapper when passed an unsupported block type', () => {
		const block = {
			name: 'core/paragraph',
			edit: baseEditFunction,
		};

		const wrappedBlock = addTweetstormToTweets( block );

		expect( wrappedBlock ).toEqual( block );
	} );

	it( 'should add the wrapper when passed core/embed block definition', () => {
		const block = {
			name: 'core/embed',
			edit: baseEditFunction,
			props: {
				attributes: {
					url: 'https://twitter.com/GaryPendergast/status/934003415507546112',
					providerNameSlug: 'twitter',
				},
				isSelected: true,
			},
		};

		const wrappedBlock = addTweetstormToTweets( block );

		expect( wrappedBlock ).not.toEqual( block );
		expect( wrappedBlock.edit.name ).toBe( 'Component' );

		render( <wrappedBlock.edit { ...block.props } /> );
		expect( screen.getByText( 'Base Edit' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'BlockControls' ) ).toBeInTheDocument();
	} );

	it( 'should not add block controls when passed a core/embed block definition with a different providerNameSlug', () => {
		const block = {
			name: 'core/embed',
			edit: baseEditFunction,
			props: {
				attributes: {
					url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
					providerNameSlug: 'youtube',
				},
				isSelected: true,
			},
		};

		const wrappedBlock = addTweetstormToTweets( block );

		expect( wrappedBlock ).not.toEqual( block );
		expect( wrappedBlock.edit.name ).toBe( 'Component' );

		render( <wrappedBlock.edit { ...block.props } /> );
		expect( screen.getByText( 'Base Edit' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'BlockControls' ) ).not.toBeInTheDocument();
	} );
} );
