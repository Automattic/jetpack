import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useCallback } from '@wordpress/element';
import { makeSchemaSettings } from '../../../data/test/fixtures/schema-settings-fixtures';
import type { SettingsResponse } from '../../../data/settings-types';

const apiFetch = jest.fn< ( options: unknown ) => Promise< unknown > >();
const setCrawlers = jest.fn();
jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: apiFetch } ) );
let storedSettings: SettingsResponse;
jest.unstable_mockModule( '@wordpress/data', () => ( {
	select: () => ( { getSettings: () => storedSettings } ),
	useDispatch: () => ( {
		setCrawlers,
		setSettings: ( value: SettingsResponse ) => {
			storedSettings = value;
		},
		createInfoNotice: jest.fn(),
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
	} ),
} ) );
jest.unstable_mockModule( '../../../data/settings-store', () => ( {
	settingsStore: 'seo/settings',
} ) );
jest.unstable_mockModule( '../../../data/record-seo-event', () => ( {
	recordSeoEvent: jest.fn(),
} ) );
jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.unstable_mockModule( '../../../data/geo-store', () => ( { geoStore: {} } ) );
const { default: DataSharingSettings } = await import( '../data-sharing-settings' );
const { useSettingsForm } = await import( '../../../data/use-settings' );
const status = {
	prevent_sharing: false,
	locked: false,
	privacy_url: '/wp-admin/options-reading.php',
};
beforeEach( () => jest.resetAllMocks() );

it( 'sends only consent and refreshes crawler state after confirmation', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch', { name: 'Prevent third-party sharing' } );
	await waitFor( () => expect( control ).toBeEnabled() );
	const crawlers = { blocked: { training: [ 'gptbot' ], answer: [] }, dataSharingOptOut: true };
	apiFetch
		.mockResolvedValueOnce( { ...status, prevent_sharing: true } )
		.mockResolvedValueOnce( { crawlers } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await waitFor( () => expect( setCrawlers ).toHaveBeenCalledWith( crawlers ) );
	expect( apiFetch ).toHaveBeenNthCalledWith( 2, {
		path: '/jetpack/v4/seo/data-sharing',
		method: 'POST',
		data: { prevent_sharing: true },
	} );
	expect( control ).toBeChecked();
} );

it( 'shows effective protection without changing a saved preference while visibility locks it', async () => {
	apiFetch.mockResolvedValueOnce( { ...status, locked: true } );
	render( <DataSharingSettings visibility="private" /> );
	const control = await screen.findByRole( 'switch', { name: 'Prevent third-party sharing' } );
	await waitFor( () => expect( control ).toBeChecked() );
	expect( control ).toHaveAttribute( 'aria-disabled', 'true' );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	expect( screen.getByRole( 'link', { name: 'Manage site visibility' } ) ).toHaveAttribute(
		'href',
		'/wp-admin/options-reading.php'
	);
} );

it( 'retains the saved value when consent is rejected', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch', { name: 'Prevent third-party sharing' } );
	await waitFor( () => expect( control ).toBeEnabled() );
	apiFetch.mockRejectedValueOnce( new Error( 'Rejected' ) ).mockResolvedValueOnce( status );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await expect(
		screen.findByText( 'Unable to save the sharing preference. Please try again.' )
	).resolves.toBeInTheDocument();
	expect( control ).not.toBeChecked();
	expect( setCrawlers ).not.toHaveBeenCalled();
	await waitFor( () => expect( control ).toBeEnabled() );
	apiFetch
		.mockResolvedValueOnce( { ...status, prevent_sharing: true } )
		.mockResolvedValueOnce( { crawlers: { dataSharingOptOut: true } } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await waitFor( () => expect( control ).toBeChecked() );
	expect(
		screen.queryByText( 'Unable to save the sharing preference. Please try again.' )
	).not.toBeInTheDocument();
} );

it( 'shows no consent value until the initial request resolves', async () => {
	let resolveStatus!: ( value: unknown ) => void;
	apiFetch.mockReturnValueOnce(
		new Promise( resolve => {
			resolveStatus = resolve;
		} )
	);
	render( <DataSharingSettings visibility="public" /> );
	expect( screen.queryByRole( 'switch' ) ).not.toBeInTheDocument();
	await act( async () => resolveStatus( status ) );
	await expect( screen.findByRole( 'switch' ) ).resolves.not.toBeChecked();
} );

it( 'does not offer an unconfirmed switch after a load error', async () => {
	apiFetch.mockRejectedValueOnce( new Error( 'Unavailable' ) );
	render( <DataSharingSettings visibility="public" /> );
	await expect(
		screen.findByText( 'Unable to load the sharing preference. Reload this page to try again.' )
	).resolves.toBeInTheDocument();
	expect( screen.queryByRole( 'switch' ) ).not.toBeInTheDocument();
} );

it( 'distinguishes a saved preference from a failed crawler refresh', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	apiFetch
		.mockResolvedValueOnce( { ...status, prevent_sharing: true } )
		.mockRejectedValueOnce( new Error( 'Unavailable' ) );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await expect(
		screen.findByText(
			'The preference was saved, but crawler status could not be refreshed. Reload this page to see the latest status.'
		)
	).resolves.toBeInTheDocument();
	expect( control ).toBeChecked();
	expect( control ).toBeEnabled();
	expect( setCrawlers ).not.toHaveBeenCalled();
} );

it( 'reports an unconfirmed save without claiming the requested value was stored', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	apiFetch.mockResolvedValueOnce( status );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await expect(
		screen.findByText(
			'The sharing preference could not be confirmed. Reload this page before trying again.'
		)
	).resolves.toBeInTheDocument();
	expect( control ).not.toBeChecked();
	expect( setCrawlers ).not.toHaveBeenCalled();
} );

it( 'keeps a new visibility restriction when an older save response arrives', async () => {
	apiFetch.mockResolvedValueOnce( status );
	const { rerender } = render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	let resolveSave!: ( value: unknown ) => void;
	apiFetch
		.mockReturnValueOnce(
			new Promise( resolve => {
				resolveSave = resolve;
			} )
		)
		.mockResolvedValueOnce( { ...status, locked: true } )
		.mockResolvedValueOnce( { crawlers: { dataSharingOptOut: true } } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	rerender( <DataSharingSettings visibility="private" /> );
	await expect(
		screen.findByText( /Your site visibility settings already prevent sharing/ )
	).resolves.toBeInTheDocument();
	await act( async () => resolveSave( { ...status, prevent_sharing: true } ) );
	const restricted = screen.getByRole( 'switch' );
	expect( restricted ).toHaveAttribute( 'aria-disabled', 'true' );
	expect( restricted ).toBeChecked();
} );

it( 'recovers a persisted preference after a lost save response', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	apiFetch
		.mockRejectedValueOnce( new Error( 'Response interrupted after storage changed' ) )
		.mockResolvedValueOnce( { ...status, prevent_sharing: true } )
		.mockResolvedValueOnce( { crawlers: { dataSharingOptOut: true } } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await waitFor( () => expect( control ).toBeChecked() );
	expect( setCrawlers ).toHaveBeenCalledWith( { dataSharingOptOut: true } );
} );

it( 'hides an unconfirmed value when a failed save cannot re-read storage', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	apiFetch
		.mockRejectedValueOnce( new Error( 'Response interrupted' ) )
		.mockRejectedValueOnce( new Error( 'Readback unavailable' ) );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await expect(
		screen.findByText(
			'The sharing preference could not be confirmed. Reload this page before trying again.'
		)
	).resolves.toBeInTheDocument();
	expect( screen.queryByRole( 'switch' ) ).not.toBeInTheDocument();
} );

const SharingWithSettingsForm = () => {
	const form = useSettingsForm();
	const changeIndexing = useCallback(
		() => form.commit( { search_engines_visible: ! form.local!.search_engines_visible } ),
		[ form ]
	);
	return (
		<>
			<button onClick={ changeIndexing }>Change indexing</button>
			<DataSharingSettings
				disabled={ form.isSaving }
				visibility={ String( form.local!.search_engines_visible ) }
			/>
		</>
	);
};

it.each( [
	[ true, true ],
	[ false, true ],
	[ true, false ],
	[ false, false ],
] )(
	'confirms sharing after indexing changes from %s, write succeeds: %s',
	async ( initiallyVisible, succeeds ) => {
		storedSettings = {
			front_page_description: '',
			has_legacy_front_page_meta: false,
			title_formats: {},
			title_separator: '-',
			title_formats_editable: true,
			verification_tools_active: true,
			seo_tools_active: true,
			verification: { google: '', bing: '', pinterest: '', yandex: '', facebook: '' },
			search_engines_visible: initiallyVisible,
			site_is_private: false,
			site_is_coming_soon: false,
			site_visibility_url: '',
			sitemap_active: false,
			sitemap_switchable: true,
			sitemap_url: '',
			canonical_active: false,
			canonical_switchable: true,
			canonical_conflicted: false,
			schema: makeSchemaSettings(),
		};
		let serverVisible = initiallyVisible;
		let finishWrite!: ( value: unknown ) => void;
		let failWrite!: ( reason: unknown ) => void;
		const write = new Promise( ( resolve, reject ) => {
			finishWrite = resolve;
			failWrite = reject;
		} );
		let confirmSharing!: ( value: unknown ) => void;
		const confirmation = new Promise( resolve => {
			confirmSharing = resolve;
		} );
		let reads = 0;
		let writeStarted = false;
		let writeSettled = false;
		apiFetch.mockImplementation( async options => {
			const request = options as { path: string; method?: string };
			if ( request.path === '/jetpack/v4/seo/data-sharing' ) {
				reads++;
				return reads === 1 || ! writeSettled
					? { ...status, locked: ! serverVisible }
					: confirmation;
			}
			if ( request.path === '/wp/v2/settings' && request.method === 'POST' ) {
				writeStarted = true;
				return write;
			}
			if ( request.path === '/jetpack/v4/seo/settings' ) {
				return { ...storedSettings, search_engines_visible: serverVisible };
			}
			throw new Error( 'Unexpected settings request' );
		} );
		render( <SharingWithSettingsForm /> );
		const control = await screen.findByRole( 'switch' );
		// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
		fireEvent.click( screen.getByRole( 'button', { name: 'Change indexing' } ) );
		await waitFor( () => expect( writeStarted ).toBe( true ) );
		expect( reads ).toBe( 1 );
		expect( screen.getByRole( 'switch' ) ).toBe( control );
		expect( control ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.queryByText( 'Loading sharing preference…' ) ).not.toBeInTheDocument();
		await act( async () => {
			writeSettled = true;
			if ( succeeds ) {
				serverVisible = ! initiallyVisible;
				finishWrite( { blog_public: serverVisible ? 1 : 0 } );
			} else {
				failWrite( new Error( 'Indexing save rejected' ) );
			}
		} );
		await waitFor( () => expect( reads ).toBe( 2 ) );
		expect( screen.getByRole( 'switch' ) ).toBe( control );
		expect( control ).toHaveAttribute( 'aria-disabled', 'true' );
		await act( async () => confirmSharing( { ...status, locked: ! serverVisible } ) );
		expect( screen.getByRole( 'switch', { checked: ! serverVisible } ) ).toBe( control );
		expect( control.getAttribute( 'aria-disabled' ) === 'true' ).toBe( ! serverVisible );
		expect(
			apiFetch.mock.calls.filter(
				( [ options ] ) => ( options as { method?: string } ).method === 'POST'
			)
		).toEqual( [
			[
				{
					path: '/wp/v2/settings',
					method: 'POST',
					data: { blog_public: initiallyVisible ? 0 : 1 },
				},
			],
		] );
	}
);

it( 'keeps the confirmed switch disabled if refreshing after a settings save fails', async () => {
	apiFetch.mockResolvedValueOnce( status );
	const { rerender } = render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	apiFetch.mockRejectedValueOnce( new Error( 'Readback unavailable' ) );
	rerender( <DataSharingSettings visibility="discouraged" disabled /> );
	rerender( <DataSharingSettings visibility="discouraged" /> );
	await expect(
		screen.findByText( 'Unable to load the sharing preference. Reload this page to try again.' )
	).resolves.toBeInTheDocument();
	expect( screen.getByRole( 'switch' ) ).toBe( control );
	expect( control ).toHaveAttribute( 'aria-disabled', 'true' );
	const calls = apiFetch.mock.calls.length;
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	expect( apiFetch ).toHaveBeenCalledTimes( calls );
} );

it.each( [ false, true ] )(
	'ignores an older status read after a newer save, rejected: %s',
	async rejected => {
		apiFetch.mockResolvedValueOnce( status );
		const { rerender } = render( <DataSharingSettings visibility="public" /> );
		const control = await screen.findByRole( 'switch' );
		let resolveOld!: ( value: unknown ) => void;
		let rejectOld!: ( error: Error ) => void;
		apiFetch.mockReturnValueOnce(
			new Promise( ( resolve, reject ) => {
				resolveOld = resolve;
				rejectOld = reject;
			} )
		);
		rerender( <DataSharingSettings visibility="discouraged" /> );
		rerender( <DataSharingSettings visibility="public" disabled /> );
		apiFetch.mockResolvedValueOnce( status );
		rerender( <DataSharingSettings visibility="public" /> );
		await waitFor( () => expect( control ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
		await act( async () =>
			rejected
				? rejectOld( new Error( 'Stale read failed' ) )
				: resolveOld( { ...status, locked: true } )
		);
		expect( control ).not.toBeChecked();
		expect( control ).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.queryByText( /Unable to load the sharing preference/ ) ).not.toBeInTheDocument();
	}
);
