import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const apiFetch = jest.fn< ( options: unknown ) => Promise< unknown > >();
jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: apiFetch } ) );
const { default: IndexnowSettings } = await import( '../indexnow-settings' );

const status = {
	enabled: false,
	pending: 0,
	latest: { state: 'idle' },
	pause_reason: '',
	cooldown_active: false,
	scheduling_delayed: false,
	enqueue_error: null,
};

/**
 * Render the inline settings row.
 * @return The visible notification toggle.
 */
async function openSettings() {
	render( <IndexnowSettings isSaving={ false } /> );
	return screen.findByRole( 'switch', { name: 'Notify search engines when content changes' } );
}

beforeEach( () => jest.resetAllMocks() );
afterEach( () => {
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
} );

it( 'draws the preloaded toggle at once and keeps a save for the next visit', async () => {
	( window as unknown as { JetpackScriptData: unknown } ).JetpackScriptData = {
		seo: { preload: { '/jetpack/v4/seo/indexnow': { body: status } } },
	};
	apiFetch.mockResolvedValueOnce( status );
	const { unmount } = render( <IndexnowSettings isSaving={ false } /> );
	const toggle = screen.getByRole( 'switch', {
		name: 'Notify search engines when content changes',
	} );
	expect( screen.queryByText( /Loading search engine notification/ ) ).not.toBeInTheDocument();
	await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
	apiFetch.mockResolvedValueOnce( { ...status, enabled: true } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the existing settings tests.
	fireEvent.click( toggle );
	await waitFor( () => expect( toggle ).toBeChecked() );
	unmount();
	apiFetch.mockImplementationOnce( () => new Promise( () => {} ) );
	render( <IndexnowSettings isSaving={ false } /> );
	expect(
		screen.getByRole( 'switch', { name: 'Notify search engines when content changes' } )
	).toBeChecked();
} );

it( 'reads the status only after a save that outlived the previous tab', async () => {
	apiFetch.mockResolvedValueOnce( status );
	const { unmount } = render( <IndexnowSettings isSaving={ false } /> );
	const toggle = await screen.findByRole( 'switch', {
		name: 'Notify search engines when content changes',
	} );
	let finishSave: ( value: unknown ) => void = () => {};
	apiFetch.mockImplementationOnce(
		() =>
			new Promise( resolve => {
				finishSave = resolve;
			} )
	);
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the existing settings tests.
	fireEvent.click( toggle );
	unmount();
	apiFetch.mockResolvedValueOnce( { ...status, enabled: true } );
	render( <IndexnowSettings isSaving={ false } /> );
	expect( apiFetch ).toHaveBeenCalledTimes( 2 );
	await act( async () => {
		finishSave( { ...status, enabled: true } );
	} );
	await waitFor( () =>
		expect(
			screen.getByRole( 'switch', { name: 'Notify search engines when content changes' } )
		).toBeChecked()
	);
	expect( apiFetch ).toHaveBeenCalledTimes( 3 );
} );

it( 'keeps the opt-in off after a rejected save, then permits a retry', async () => {
	apiFetch.mockResolvedValueOnce( status );
	const toggle = await openSettings();
	expect( screen.getAllByRole( 'switch' ) ).toHaveLength( 1 );
	apiFetch.mockRejectedValueOnce( new Error( 'Rejected' ) );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the existing settings tests.
	fireEvent.click( toggle );
	await expect(
		screen.findAllByText(
			'The search engine notification setting could not be saved. Please try again.'
		)
	).resolves.not.toHaveLength( 0 );
	expect( toggle ).not.toBeChecked();
	apiFetch.mockResolvedValueOnce( { ...status, enabled: true } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the existing settings tests.
	fireEvent.click( toggle );
	await waitFor( () => expect( toggle ).toBeChecked() );
	expect( apiFetch ).toHaveBeenLastCalledWith( {
		path: '/jetpack/v4/seo/indexnow',
		method: 'POST',
		data: { enabled: true },
	} );
} );

it( 'allows opting out on a private site', async () => {
	apiFetch.mockResolvedValueOnce( {
		...status,
		enabled: true,
		pause_reason: 'not_public',
	} );
	const toggle = await openSettings();
	expect( toggle ).toBeEnabled();
	expect(
		screen.getByText( /Notifications are paused while this site is private/ )
	).toBeInTheDocument();
	apiFetch.mockResolvedValueOnce( { ...status, pause_reason: 'not_public' } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the existing settings tests.
	fireEvent.click( toggle );
	await waitFor( () => expect( toggle ).not.toBeChecked() );
	expect( toggle ).toHaveAttribute( 'aria-disabled', 'true' );
} );

it.each( [
	[
		{
			latest: { state: 'http_429' },
			cooldown_active: true,
		},
		/limited requests/,
	],
	[ { latest: { state: 'http_403' } }, /could not verify site ownership/ ],
	[ { latest: { state: 'http_422' } }, /rejected the notification/ ],
	[ { latest: { state: 'transport_failure' }, pending: 1 }, /delivery problem/ ],
	[
		{ latest: { state: 'accepted', exhausted: 1 } },
		/Missed notifications are not automatically replayed/,
	],
	[
		{ latest: { state: 'expired', expired: 1 } },
		/Missed notifications are not automatically replayed/,
	],
	[
		{ enqueue_error: { state: 'queue_full_or_busy' } },
		/Missed notifications are not automatically replayed/,
	],
	[ { pending: 1, scheduling_delayed: true }, /Delivery is waiting for WordPress scheduled tasks/ ],
	[ { pause_reason: 'address_changed' }, /Turn notifications off and on again/ ],
	[ { pause_reason: 'provider' }, /paused by another SEO plugin or your hosting provider/ ],
] )( 'explains delivery state %j without extra controls', async ( extra, expected ) => {
	apiFetch.mockResolvedValueOnce( { ...status, enabled: true, ...extra } );
	await openSettings();
	expect( screen.getAllByText( expected ).length ).toBeGreaterThan( 0 );
	expect( screen.getAllByRole( 'switch' ) ).toHaveLength( 1 );
	expect( screen.queryByRole( 'spinbutton' ) ).not.toBeInTheDocument();
} );

it( 'does not label a 202 receipt as successful verification or indexing', async () => {
	apiFetch.mockResolvedValueOnce( {
		...status,
		enabled: true,
		latest: {
			state: 'verification_pending',
			accepted: { state: 'verification_pending', time: 1700000000, count: 2 },
		},
	} );
	await openSettings();
	expect(
		screen.getByText( /Last received:.*Site ownership verification is pending/ )
	).toBeInTheDocument();
	expect( screen.queryByText( /Last accepted:/ ) ).not.toBeInTheDocument();
} );

it( 'retains the last acceptance alongside a newer delivery error', async () => {
	apiFetch.mockResolvedValueOnce( {
		...status,
		enabled: true,
		latest: {
			state: 'transport_failure',
			accepted: { state: 'accepted', time: 1700000000, count: 2 },
		},
	} );
	await openSettings();
	expect(
		screen.getByText( /Last accepted:.*Acceptance does not confirm indexing/ )
	).toBeInTheDocument();
	expect( screen.getAllByText( /delivery problem/ ).length ).toBeGreaterThan( 0 );
} );

it( 'does not promise retries for rejected notifications', async () => {
	apiFetch.mockResolvedValueOnce( {
		...status,
		enabled: true,
		latest: { state: 'http_404', dropped: 2, retrying: 0 },
	} );
	await openSettings();
	expect(
		screen.getAllByText( /Check the receiving service and site configuration/ ).length
	).toBeGreaterThan( 0 );
	expect(
		screen.getAllByText( /Missed notifications are not automatically replayed/ ).length
	).toBeGreaterThan( 0 );
	expect( screen.queryByText( /Pending notifications will be retried/ ) ).not.toBeInTheDocument();
} );

it( 'only promises retries when the backend retained retryable notifications', async () => {
	apiFetch.mockResolvedValueOnce( {
		...status,
		enabled: true,
		pending: 2,
		latest: { state: 'transport_failure', retrying: 2 },
	} );
	await openSettings();
	expect( screen.getAllByText( /Pending notifications will be retried/ ).length ).toBeGreaterThan(
		0
	);
} );

it( 'shows only the pause reason while delivery is paused', async () => {
	apiFetch.mockResolvedValueOnce( {
		...status,
		enabled: true,
		pause_reason: 'address_changed',
		pending: 2,
		enqueue_error: { state: 'queue_full_or_busy' },
		latest: { state: 'accepted', accepted: { state: 'accepted', time: 1700000000, count: 1 } },
	} );
	const toggle = await openSettings();
	expect( toggle ).toHaveAccessibleDescription( /The site address changed/ );
	expect( screen.queryByText( /waiting for delivery/ ) ).not.toBeInTheDocument();
	expect( screen.queryByText( /Last accepted:/ ) ).not.toBeInTheDocument();
	expect( screen.queryByText( /Missed notifications/ ) ).not.toBeInTheDocument();
} );

it.each( [
	[ 'not_public', /available only on public/ ],
	[ 'module_inactive', /Enable SEO tools/ ],
	[ 'provider', /hosting provider prevents notifications/ ],
] )( 'describes the disabled switch for %s', async ( reason, expected ) => {
	apiFetch.mockResolvedValueOnce( { ...status, pause_reason: reason } );
	const toggle = await openSettings();
	expect( toggle ).toHaveAttribute( 'aria-disabled', 'true' );
	expect( toggle ).toHaveAccessibleDescription( expected );
} );

it( 'formats receipt dates in the site timezone', async () => {
	const { getSettings, setSettings } = await import( '@wordpress/date' );
	const original = getSettings();
	setSettings( {
		...original,
		formats: { ...original.formats, datetime: 'Y-m-d H:i' },
		timezone: { ...original.timezone, string: 'America/New_York' },
	} );
	try {
		apiFetch.mockResolvedValueOnce( {
			...status,
			enabled: true,
			latest: { state: 'accepted', accepted: { state: 'accepted', time: 1700000000, count: 1 } },
		} );
		await openSettings();
		expect( screen.getByText( /Last accepted: 2023-11-14 17:13/ ) ).toBeInTheDocument();
	} finally {
		setSettings( original );
	}
} );

it( 'shows how many notifications are waiting', async () => {
	apiFetch.mockResolvedValueOnce( { ...status, enabled: true, pending: 300 } );
	await openSettings();
	expect( screen.getByText( '300 notifications waiting for delivery.' ) ).toBeInTheDocument();
} );

it( 'does not let an older background read undo a saved preference', async () => {
	apiFetch.mockResolvedValueOnce( status );
	const toggle = await openSettings();
	let resolveOld: ( value: unknown ) => void = () => {};
	apiFetch.mockImplementationOnce(
		() =>
			new Promise( resolve => {
				resolveOld = resolve;
			} )
	);
	fireEvent( window, new Event( 'focus' ) );
	apiFetch.mockResolvedValueOnce( { ...status, enabled: true } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the existing settings tests.
	fireEvent.click( toggle );
	await waitFor( () => expect( toggle ).toBeChecked() );
	await act( async () => {
		resolveOld( status );
	} );
	expect( toggle ).toBeChecked();
} );

it.each( [ false, true ] )(
	'refreshes readiness after a parent save settles (indexing allowed: %s)',
	async allowed => {
		apiFetch.mockResolvedValueOnce( { ...status, enabled: true } );
		const { rerender } = render( <IndexnowSettings isSaving={ false } /> );
		const toggle = await screen.findByRole( 'switch', {
			name: 'Notify search engines when content changes',
		} );
		rerender( <IndexnowSettings isSaving /> );
		expect( toggle ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		apiFetch.mockResolvedValueOnce( {
			...status,
			enabled: true,
			pause_reason: allowed ? '' : 'not_public',
		} );
		rerender( <IndexnowSettings isSaving={ false } /> );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 2 ) );
		await waitFor( () =>
			expect( Boolean( screen.queryByText( /Notifications are paused/ ) ) ).toBe( ! allowed )
		);
		expect( toggle ).toBeChecked();
		expect( toggle ).not.toHaveAttribute( 'aria-disabled', 'true' );
	}
);

it( 'discards a status read started before a visibility save', async () => {
	let resolveOld: ( value: unknown ) => void = () => {};
	apiFetch.mockImplementationOnce(
		() =>
			new Promise( resolve => {
				resolveOld = resolve;
			} )
	);
	const { rerender } = render( <IndexnowSettings isSaving={ false } /> );
	rerender( <IndexnowSettings isSaving /> );
	apiFetch.mockResolvedValueOnce( {
		...status,
		enabled: true,
		pause_reason: 'not_public',
	} );
	rerender( <IndexnowSettings isSaving={ false } /> );
	await expect(
		screen.findByText( /Notifications are paused while this site is private/ )
	).resolves.toBeInTheDocument();
	await act( async () => {
		resolveOld( { ...status, enabled: true } );
	} );
	expect(
		screen.getByText( /Notifications are paused while this site is private/ )
	).toBeInTheDocument();
} );

it( 'explains the prerequisite without calling a never-enabled feature paused', async () => {
	apiFetch.mockResolvedValueOnce( { ...status, pause_reason: 'not_public' } );
	const toggle = await openSettings();
	expect( toggle ).toHaveAttribute( 'aria-disabled', 'true' );
	expect(
		screen.getByText( /Notifications are available only on public, production sites/ )
	).toBeInTheDocument();
	expect( screen.queryByText( /Notifications are paused/ ) ).not.toBeInTheDocument();
} );

it( 'keeps status loading failures local and recovers on refocus', async () => {
	apiFetch.mockRejectedValueOnce( new Error( 'Unavailable' ) );
	render( <IndexnowSettings isSaving={ false } /> );
	await expect(
		screen.findAllByText( /Search engine notification status could not be loaded/ )
	).resolves.not.toHaveLength( 0 );
	apiFetch.mockResolvedValueOnce( status );
	fireEvent( window, new Event( 'focus' ) );
	await expect(
		screen.findByRole( 'switch', { name: 'Notify search engines when content changes' } )
	).resolves.toBeInTheDocument();
	expect( screen.queryByText( /status could not be loaded/ ) ).not.toBeInTheDocument();
} );

it( 'releases the visibility lock when a notification save fails', async () => {
	apiFetch.mockResolvedValueOnce( status );
	const onSavingChange = jest.fn();
	render( <IndexnowSettings isSaving={ false } onSavingChange={ onSavingChange } /> );
	const toggle = await screen.findByRole( 'switch', {
		name: 'Notify search engines when content changes',
	} );
	apiFetch.mockRejectedValueOnce( new Error( 'Rejected' ) );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the existing settings tests.
	fireEvent.click( toggle );
	await expect( screen.findAllByText( /setting could not be saved/ ) ).resolves.not.toHaveLength(
		0
	);
	expect( onSavingChange.mock.calls ).toEqual( [ [ true ], [ false ] ] );
	expect( toggle ).not.toBeChecked();
} );
