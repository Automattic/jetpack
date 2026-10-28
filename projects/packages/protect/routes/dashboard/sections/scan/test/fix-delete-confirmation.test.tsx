import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { FixDeleteConfirmation, FixDeleteModal } from '../fix-delete-confirmation';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const threat = {
	id: 7,
	signature: 'Vulnerable.WP.Extension',
	title: 'Vulnerable plugin',
	fixable: { fixer: 'delete', extensionStatus: 'inactive' },
	extension: { type: 'plugins' as const, slug: 'akismet', name: 'Akismet', version: '1.0' },
};

window.jetpackProtectDashboard = {
	scan: { hasPlan: true, url: '#', error: false, threats: [], ignored: [] },
};

describe( 'FixDeleteModal', () => {
	it( 'starts the fix only once the slug is typed', async () => {
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( { status: 'fixed' } );
		const closeModal = jest.fn();
		render( <FixDeleteModal items={ [ threat ] } closeModal={ closeModal } /> );
		const confirm = screen.getByRole( 'button', { name: 'Confirm deletion' } );

		await userEvent.type( screen.getByRole( 'textbox' ), 'akismet-wrong' );
		await userEvent.click( confirm );
		expect( apiFetch ).not.toHaveBeenCalled();

		await userEvent.clear( screen.getByRole( 'textbox' ) );
		await userEvent.type( screen.getByRole( 'textbox' ), 'akismet' );
		await userEvent.click( confirm );

		await waitFor( () =>
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( '/threats/7/fix' ) } )
			)
		);
		expect( closeModal ).toHaveBeenCalled();
	} );

	it.each( [
		[ 'plugins', 'inactive', 'active', /This plugin seems to be currently active/ ],
		[ 'themes', 'inactive', 'parent', /This theme seems to be currently active/ ],
		[ 'plugins', 'active', 'inactive', /This plugin seems to not currently be active/ ],
		[ 'plugins', 'active', undefined, /This plugin seems to be currently active/ ],
	] as const )(
		'warns about a %s with scan status %s and live state %s',
		( type, extensionStatus, state, warning ) => {
			render(
				<FixDeleteConfirmation
					threat={ {
						...threat,
						fixable: { fixer: 'delete', extensionStatus },
						extension: { ...threat.extension, type, state },
					} }
					onConfirm={ jest.fn() }
				/>
			);
			expect( screen.getByText( warning ) ).toBeInTheDocument();
		}
	);
} );
