/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getTagsFields } from './fields';
import type { StatsTagsItem } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

// The fields import `Icon`/`Link` from the externals passthrough, so the stubs
// have to replace them there. Everything else falls through to the real barrel:
// a plain object would leave the rest of it undefined for any other consumer in
// the graph, and calling `requireActual` eagerly re-enters the module while it
// is still initialising.
jest.mock(
	'@jetpack-premium-analytics/externals',
	() =>
		new Proxy(
			{
				Icon: () => null,
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

const tag = {
	label: [ { label: 'Recipes', labelIcon: 'tag' } ],
	labelText: 'Recipes',
	link: 'https://example.com/tag/recipes/',
	value: 42,
} as unknown as StatsTagsItem;

/**
 * Mount the label field's render component for a table row.
 *
 * @param item - The tags report row to render.
 * @return The Testing Library render result.
 */
function renderLabelField( item: StatsTagsItem ) {
	const field = getTagsFields().find( candidate => candidate.id === 'label' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field render component.
	const LabelField = field?.render;

	if ( ! field || ! LabelField ) {
		throw new Error( 'Tags label field render callback is unavailable' );
	}

	return render( <LabelField item={ item } field={ field as never } /> );
}

describe( 'tags fields', () => {
	it( 'links a tag to its archive', () => {
		renderLabelField( tag );

		const link = screen.getByRole( 'link', { name: 'Recipes' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/tag/recipes/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'renders the tag as plain text when its URL is unsafe', () => {
		renderLabelField( { ...tag, link: 'javascript:alert(1)' } as StatsTagsItem );

		expect( screen.getByText( 'Recipes' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
