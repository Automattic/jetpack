import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import App from '../main';

// Kept in its own file so no other test can load the tab module first.
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );
jest.mock( '@wordpress/api-fetch' );
// Counted on globalThis: a static import would run this factory before any local exists.
jest.mock( '../scheduled-tasks/index', () => {
	globalThis.scheduledTasksModuleLoads = ( globalThis.scheduledTasksModuleLoads ?? 0 ) + 1;
	return jest.requireActual( '../scheduled-tasks/index' );
} );

test( 'scheduled tasks flag off: never loads the tab module', async () => {
	window.jetpackAiSettings = { showFeaturesView: true };
	window.location.hash = '#/features';
	apiFetch.mockResolvedValue( {
		host_allows_ai: true,
		master_enabled: true,
		is_connected: true,
		plan: { supports_ai: true },
		features: { writing_assistant: { enabled: true } },
	} );

	render( <App /> );

	await expect(
		screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
	).resolves.toBeInTheDocument();
	expect( globalThis.scheduledTasksModuleLoads ).toBeUndefined();
} );
