/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import addTweetstormToTweets from '../editor';

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
		expect( wrappedBlock.edit.name ).toEqual( 'Component' );

		const wrapper = mount( <wrappedBlock.edit { ...block.props } /> );

		expect( wrapper.exists( '#baseEdit' ) ).toEqual( true );
		expect( wrapper.find( 'BlockControlsFill' ) ).toHaveLength( 2 );
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
		expect( wrappedBlock.edit.name ).toEqual( 'Component' );

		const wrapper = mount( <wrappedBlock.edit { ...block.props } /> );

		expect( wrapper.exists( '#baseEdit' ) ).toEqual( true );
		expect( wrapper.find( 'BlockControlsFill' ) ).toHaveLength( 0 );
	} );
} );
