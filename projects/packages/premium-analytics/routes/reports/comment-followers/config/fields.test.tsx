/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getCommentFollowersFields } from './fields';
import type { StatsCommentFollowersItem } from '@jetpack-premium-analytics/data';

/**
 * Mount the post field's render component for a table row.
 *
 * @param item - The comment-followers row to render.
 * @return The Testing Library render result.
 */
function renderPostField( item: StatsCommentFollowersItem ) {
	const field = getCommentFollowersFields().find( candidate => candidate.id === 'post' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const PostField = field?.render;

	if ( ! field || ! PostField ) {
		throw new Error( 'Comment followers post field render callback is unavailable' );
	}

	return render( <PostField item={ item } field={ field as never } /> );
}

describe( 'comment followers fields', () => {
	it( 'renders real posts as external links', () => {
		renderPostField( {
			id: 42,
			label: 'Hello world',
			followers: 12,
			value: 12,
			link: 'https://example.com/hello-world/',
			labelIcon: 'external',
			children: null,
		} );

		const link = screen.getByRole( 'link', { name: 'Hello world' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/hello-world/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		// eslint-disable-next-line testing-library/no-node-access -- The external-link icon SVG has no accessible role or text to query.
		expect( link.querySelector( 'svg' ) ).toBeInTheDocument();
	} );

	it( 'uses followers as the Subscribers field value', () => {
		const subscribersField = getCommentFollowersFields().find(
			candidate => candidate.id === 'subscribers'
		);
		const item: StatsCommentFollowersItem = {
			id: 42,
			label: 'Hello world',
			followers: 12,
			value: 12,
			children: null,
		};

		expect( subscribersField?.getValue?.( { item } as never ) ).toBe( 12 );
	} );
} );
