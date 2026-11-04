import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import {
	FixUpdateConfirmation,
	getUpdateFixTitle,
	makeFixUpdateModal,
} from '../fix-update-confirmation';
import type { ScanThreat } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const threatIn = ( id: number, name: string, extras = {} ): ScanThreat => ( {
	id,
	signature: 'Vulnerable.WP.Extension',
	title: 'Vulnerable plugin',
	fixable: { fixer: 'update', target: '2.0.3.1', extras },
	extension: { type: 'plugins', slug: name.toLowerCase(), name, version: '1.7.4' },
} );

window.jetpackProtectDashboard = {
	scan: { hasPlan: true, url: '#', error: false, threats: [], ignored: [] },
};

describe( 'FixUpdateModal', () => {
	it.each( [
		[ 'plugins', 'Update this plugin?' ],
		[ 'themes', 'Update this theme?' ],
		[ 'core', 'Update WordPress?' ],
	] as const )( 'titles a %s update', ( type, title ) => {
		const threat = threatIn( 1, 'Name' );
		threat.extension = { ...threat.extension, type };
		expect( getUpdateFixTitle( [ threat ] ) ).toBe( title );
	} );

	it( 'names the version change and starts the fix only once Update is clicked', async () => {
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( { status: 'fixed' } );
		const closeModal = jest.fn();
		const onStart = jest.fn();
		const FixUpdateModal = makeFixUpdateModal( onStart );
		const threat = threatIn( 7, 'WPForms Lite' );
		render( <FixUpdateModal items={ [ threat ] } closeModal={ closeModal } /> );

		expect(
			screen.getByText( 'Auto-fix will update WPForms Lite from version 1.7.4 to 2.0.3.1.' )
		).toBeInTheDocument();
		expect( apiFetch ).not.toHaveBeenCalled();

		await userEvent.click( screen.getByRole( 'button', { name: 'Update' } ) );

		await waitFor( () =>
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( '/threats/7/fix' ) } )
			)
		);
		expect( closeModal ).toHaveBeenCalled();
		expect( onStart ).toHaveBeenCalledWith( [ threat ] );
	} );

	it( 'lists only the updates a batch runs', () => {
		render(
			<FixUpdateConfirmation
				threats={ [
					threatIn( 1, 'Akismet' ),
					threatIn( 2, 'Hello Dolly' ),
					threatIn( 3, 'Solo', { isBulkFixable: false } ),
				] }
				onConfirm={ jest.fn() }
			/>
		);

		const items = within( screen.getByRole( 'list' ) ).getAllByRole( 'listitem' );
		expect( items.map( item => item.textContent ) ).toEqual( [
			'Akismet: 1.7.4 to 2.0.3.1',
			'Hello Dolly: 1.7.4 to 2.0.3.1',
		] );
		expect( screen.getByText( /1 other threat can only be fixed on its own/ ) ).toBeInTheDocument();
	} );
} );
