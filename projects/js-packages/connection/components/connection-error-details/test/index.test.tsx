import { render, screen } from '@testing-library/react';
import ConnectionErrorDetails from '../index';

describe( 'ConnectionErrorDetails', () => {
	// The whole error set, not just the first: the hook derives the groups and the
	// details render every one of them, each with the scopes it applies to.
	it( 'renders every error group with its scope lines', () => {
		render(
			<ConnectionErrorDetails
				errorGroups={ [
					{
						message: 'The site token is broken.',
						errors: [],
						detailLines: [ { key: 'Site connection', text: 'Site connection' } ],
						noticeLinks: [],
					},
					{
						message: 'Your user token is broken.',
						errors: [],
						detailLines: [ { key: 'Your account', text: 'Your account' } ],
						noticeLinks: [],
					},
				] }
			/>
		);

		expect( screen.getAllByText( 'The site token is broken.' ).length ).toBeGreaterThan( 0 );
		expect( screen.getAllByText( 'Your user token is broken.' ).length ).toBeGreaterThan( 0 );
		// Marked up as list items, so assistive tech announces how many scopes an
		// error covers rather than reading loose lines.
		expect( screen.getAllByRole( 'listitem' ).map( item => item.textContent ) ).toEqual( [
			'- Site connection',
			'- Your account',
		] );
	} );

	// A blocked request suppresses the reconnect CTA, so without this link the
	// viewer would be told of a problem with nothing to do about it. Rendered
	// inside the error's own group, not pooled elsewhere, so it stays attached to
	// the message it belongs to when other groups are present.
	it( 'renders a notice link directly under the error group that asked for it', () => {
		render(
			<ConnectionErrorDetails
				errorGroups={ [
					{
						message: 'WordPress.com requests to your site are being blocked.',
						errors: [],
						detailLines: [],
						noticeLinks: [ { label: 'Visit Site Health', url: '/wp-admin/site-health.php' } ],
					},
					{
						message: 'Your user token is broken.',
						errors: [],
						detailLines: [],
						noticeLinks: [],
					},
				] }
			/>
		);

		const link = screen.getByRole( 'link', { name: 'Visit Site Health' } );

		expect( link ).toHaveAttribute( 'href', '/wp-admin/site-health.php' );

		// The claim is structural — the link lives inside its own group's subtree,
		// not merely somewhere in the output — and no role or text query can express
		// containment, so walk up to the group element to make it.
		// eslint-disable-next-line testing-library/no-node-access -- Asserting DOM containment; see above.
		const group = link.closest( 'div' );

		expect( group ).toHaveTextContent(
			/^WordPress\.com requests to your site are being blocked\./
		);
		expect( group ).toContainElement( link );
	} );

	it( 'offers the support link when the error asks for one', () => {
		render( <ConnectionErrorDetails message="Something is off." showSupportLink /> );

		expect( screen.getAllByText( /Still having trouble\?/ ).length ).toBeGreaterThan( 0 );
	} );

	it( 'renders nothing when there is neither a message nor a group', () => {
		const { container } = render( <ConnectionErrorDetails message="" errorGroups={ [] } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
