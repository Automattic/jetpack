import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const useSearch = jest.fn();
const useNavigate = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-components', () => ( {
	ThemeProvider: ( { children }: { children: React.ReactNode } ) => <>{ children }</>,
} ) );

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useSearch,
	useNavigate,
} ) );

jest.unstable_mockModule( '../../../_inc/screens/content/seo-inspector', () => ( {
	default: ( { postId, postType }: { postId: number; postType: string } ) => (
		<div>
			<span>Post ID: { postId }</span>
			<span>Post type: { postType }</span>
		</div>
	),
} ) );

const { inspector: Inspector } = await import( '../../../routes/content/inspector' );

describe( 'Content route inspector', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useNavigate.mockReturnValue( jest.fn() );
	} );

	it( 'passes custom post type slugs through to the SEO inspector', () => {
		useSearch.mockReturnValue( { postId: '9', postType: 'gear_review' } );

		render( <Inspector /> );

		expect( screen.getByText( 'Post ID: 9' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Post type: gear_review' ) ).toBeInTheDocument();
	} );
} );
