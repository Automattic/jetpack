import { render, screen } from '@testing-library/react';
import { SectionHeader } from '../section-header';

describe( 'SectionHeader', () => {
	it( 'renders the title as a level-2 heading', () => {
		render( <SectionHeader title="Traffic" /> );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent( 'Traffic' );
	} );

	it( 'renders the title at the level the surface names', () => {
		render( <SectionHeader title="Hello world" headingLevel={ 1 } /> );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Hello world' );
	} );

	it( 'carries the title as an attribute, past the ellipsis', () => {
		render( <SectionHeader title="Traffic across every channel this site measures" /> );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveAttribute(
			'title',
			'Traffic across every channel this site measures'
		);
	} );

	it( 'leaves the attribute off a title that is not text', () => {
		render( <SectionHeader title={ <span data-testid="placeholder" /> } /> );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).not.toHaveAttribute( 'title' );
		expect( screen.getByTestId( 'placeholder' ) ).toBeInTheDocument();
	} );

	it( 'renders the subtitle under the title', () => {
		render( <SectionHeader title="Hello world" subTitle="Post published on Jan 10, 2026." /> );

		expect( screen.getByText( 'Post published on Jan 10, 2026.' ) ).toBeInTheDocument();
	} );

	// Decorative by contract: the title already names the resource, so the
	// visual must not reach the accessibility tree.
	it( 'hides the visual from assistive technology', () => {
		render(
			<SectionHeader
				title="Hello world"
				visual={ <img data-testid="thumb" src="/thumb.jpg" alt="" /> }
			/>
		);

		// eslint-disable-next-line testing-library/no-node-access -- The wrapper the slot owns has no accessible query target.
		expect( screen.getByTestId( 'thumb' ).parentElement ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'renders the date controls passed to the slot', () => {
		render(
			<SectionHeader title="Traffic">
				<button type="button">Last 7 days</button>
			</SectionHeader>
		);

		expect( screen.getByRole( 'button', { name: 'Last 7 days' } ) ).toBeInTheDocument();
	} );

	it( 'renders the notice under the header row', () => {
		render( <SectionHeader title="Traffic" notice={ <p>{ "Couldn't refresh." }</p> } /> );

		expect( screen.getByText( "Couldn't refresh." ) ).toBeInTheDocument();
	} );

	it( 'hands the ref the root the heading sits in', () => {
		const ref = jest.fn();

		render( <SectionHeader ref={ ref } title="Traffic" /> );

		expect( ref ).toHaveBeenCalledWith( expect.any( HTMLDivElement ) );
		expect( ref.mock.calls[ 0 ][ 0 ] ).toContainElement( screen.getByRole( 'heading' ) );
	} );

	// The marker publishes the scroll timeline the band condenses on; it has to
	// precede the band as its sibling, where the surface's timeline scope sees it.
	it( 'precedes a pinned header with its hidden pin marker', () => {
		const ref = jest.fn();

		render( <SectionHeader ref={ ref } title="Traffic" pinned /> );

		// eslint-disable-next-line testing-library/no-node-access -- The marker is measured, never seen, so it has no accessible query target.
		const marker = ref.mock.calls[ 0 ][ 0 ].previousElementSibling;

		expect( marker ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( marker ).toBeEmptyDOMElement();
	} );

	it( 'renders no pin marker unless pinned', () => {
		const ref = jest.fn();

		render( <SectionHeader ref={ ref } title="Traffic" /> );

		// eslint-disable-next-line testing-library/no-node-access -- Asserting the absence of a sibling.
		expect( ref.mock.calls[ 0 ][ 0 ].previousElementSibling ).toBeNull();
	} );
} );
