import { render, screen } from '@testing-library/react';
import ConnectionErrorDetails from '../index';

describe( 'ConnectionErrorDetails', () => {
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
		expect( screen.getAllByRole( 'listitem' ).map( item => item.textContent ) ).toEqual( [
			'- Site connection',
			'- Your account',
		] );
	} );

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

		// No role or text query expresses containment, so walk up to the group element.
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
