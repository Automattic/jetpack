/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getCommentsFields } from './fields';
import type { CommentReportRow } from './use-report-records';
import type { ReactNode } from 'react';

// The router is built dynamically at runtime, so a field-level test has no
// router to mount. Render `Link` as the anchor it becomes, keeping `to`/`params`
// assertable.
jest.mock( '@wordpress/route', () => ( {
	Link: ( {
		to,
		params,
		children,
		...props
	}: {
		to: string;
		params: Record< string, string >;
		children: ReactNode;
	} ) => (
		<a href={ to.replace( /\$(\w+)/g, ( _match, key ) => params[ key ] ) } { ...props }>
			{ children }
		</a>
	),
} ) );

// The fields import `Link` from the externals passthrough, so the stub has to
// replace it there; the Proxy leaves the rest of the barrel intact for any
// other consumer in the graph.
jest.mock(
	'@jetpack-premium-analytics/externals',
	() =>
		new Proxy(
			{
				Link: ( {
					href,
					children,
					openInNewTab,
					variant,
					...props
				}: {
					href: string;
					children: ReactNode;
					openInNewTab?: boolean;
					variant?: string;
				} ) => (
					<a
						href={ href }
						data-variant={ variant }
						target={ openInNewTab ? '_blank' : undefined }
						rel={ openInNewTab ? 'noopener noreferrer' : undefined }
						{ ...props }
					>
						{ children }
					</a>
				),
			},
			{
				get: ( overrides, prop ) =>
					prop in overrides
						? overrides[ prop as keyof typeof overrides ]
						: jest.requireActual( '@jetpack-premium-analytics/externals' )[ prop ],
			}
		)
);

/**
 * Mount the label field's render component for a table row.
 *
 * @param item - The comments report row to render.
 * @return The Testing Library render result.
 */
function renderLabelField( item: CommentReportRow ) {
	const field = getCommentsFields().find( candidate => candidate.id === 'label' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field render component.
	const LabelField = field?.render;

	if ( ! field || ! LabelField ) {
		throw new Error( 'Comments label field render callback is unavailable' );
	}

	return render( <LabelField item={ item } field={ field as never } /> );
}

describe( 'comments fields', () => {
	it( 'drills post rows with an id into the post detail page', () => {
		renderLabelField( {
			id: '42',
			label: 'Hello world',
			value: 12,
			link: 'https://example.com/hello-world/',
			postId: '42',
		} );

		const link = screen.getByRole( 'link', { name: 'Hello world' } );
		expect( link ).toHaveAttribute( 'href', '/post/42' );
		expect( link ).not.toHaveAttribute( 'target' );
	} );

	// This link is built locally in `use-report-records` from the author's email, so it is
	// document-relative by construction and must not be run through `safeHttpUrl`.
	it( 'falls back to the external link for rows without a post id', () => {
		renderLabelField( {
			id: 'author-aggie',
			label: 'Aggie',
			value: 4,
			link: 'edit-comments.php?s=aggie%40example.com',
		} );

		const link = screen.getByRole( 'link', { name: 'Aggie' } );
		expect( link ).toHaveAttribute( 'href', 'edit-comments.php?s=aggie%40example.com' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'renders a row without a link as plain text', () => {
		renderLabelField( { id: 'post-untitled', label: 'Untitled', value: 1 } );

		expect( screen.getByText( 'Untitled' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
