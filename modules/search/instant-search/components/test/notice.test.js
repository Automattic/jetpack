/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect';

import { h } from 'preact';
import { render } from '@testing-library/preact';

//import PostTypeIcon from '../post-type-icon';
import Notice from '../notice';

// test( 'returns null for an unknown post type', () => {
//   const { queryByText } = render( <PostTypeIcon postType="banana" /> );

//   expect( queryByText( 'gridicon' ) ).toBeNull();
// } );

test( 'returns a notice if the type is warning', () => {
	const { asFragment, debug } = render( <Notice type="warning" /> );
	debug();
	//expect( asFragment() ).toMatchSnapshot();
} );
