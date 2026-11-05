/* No jest-dom in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DataSyncProvider, queryClient } from '@automattic/jetpack-react-data-sync-client';
import { ModuleSurfaceProvider } from '$features/module/surface';
import CriticalCssProvider from '../../critical-css-context/critical-css-context-provider';
import CriticalCssMeta from '../../critical-css-meta/critical-css-meta';
import { runLocalGenerator } from '../generate-critical-css';
import { useCriticalCssState, useRegenerateCriticalCssAction } from './critical-css-state';
import type { CriticalCssState } from './critical-css-state-types';

jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
jest.mock( '../generate-critical-css', () => ( { runLocalGenerator: jest.fn() } ) );
jest.mock( '../..', () => ( {
	RegenerateCriticalCssSuggestion: () => null,
	useRegenerationReason: () => [ { data: null } ],
} ) );

const REST = 'http://localhost/wp-json/jetpack-boost-ds';

function state(
	status: CriticalCssState[ 'status' ],
	created: number,
	updated: number,
	providerStatus: 'pending' | 'success' = 'pending'
): CriticalCssState {
	return {
		status,
		created,
		updated,
		providers: [
			{
				key: 'core_front_page',
				label: 'Front page',
				urls: [ '/' ],
				success_ratio: 1,
				status: providerStatus,
			},
		],
	};
}

const running = state( 'pending', 200, 200 );
const finishedEarlier = state( 'generated', 100, 100, 'success' );
const errorState: CriticalCssState = { status: 'error', status_error: 'Stopped', providers: [] };

// Responses by REST path; the default answers the regenerate-reason reset. `html` replaces the JSON body.
type Reply = {
	ok?: boolean;
	status?: number;
	statusText?: string;
	body?: unknown;
	html?: string;
	// Held until resolved, to keep a request in flight.
	gate?: Promise< void >;
};
let responses: Record< string, Reply >;
const fetchMock = jest.fn( async ( url: string ) => {
	const reply = responses[ new URL( url ).pathname ] ?? { body: null };
	await reply.gate;
	const text = async () => reply.html ?? JSON.stringify( { status: 'success', JSON: reply.body } );
	return {
		ok: reply.ok ?? true,
		status: reply.status ?? ( reply.ok === false ? 500 : 200 ),
		statusText: reply.statusText ?? '',
		text,
		clone: () => ( { text } ),
	};
} );
const checkPage =
	'<!doctype html><html><head><title>One moment, please...</title></head><body><h1>Checking your browser</h1></body></html>';
const refused: Reply = {
	ok: false,
	status: 502,
	statusText: 'Bad Gateway',
	html: '<html><body><h1>502 Bad Gateway</h1></body></html>',
};

let latest: CriticalCssState | undefined;
let regenerate: () => void;
function Probe() {
	[ latest ] = useCriticalCssState();
	regenerate = useRegenerateCriticalCssAction().mutate;
	return null;
}

function mount() {
	return render(
		<DataSyncProvider>
			<Probe />
		</DataSyncProvider>
	);
}

// React Query notifies observers on a zero-delay timer, so give the component that tick to re-render.
const settle = () => act( () => new Promise( resolve => setTimeout( resolve, 20 ) ) );

function setWindowState( value: CriticalCssState ) {
	( window as unknown as Record< string, unknown > ).jetpack_boost_ds = {
		rest_api: { value: REST, nonce: 'rest' },
		critical_css_state: {
			value,
			nonce: 'state',
			actions: {
				'request-regenerate': 'regenerate',
				'set-provider-css': 'css',
				'set-provider-errors': 'errors',
			},
		},
		critical_css_meta: { value: { proxy_nonce: 'proxy' }, nonce: 'meta' },
		critical_css_suggest_regenerate: { value: null, nonce: 'reason' },
		modules_state: {
			value: { critical_css: { active: true, available: true } },
			nonce: 'modules',
		},
	};
}

beforeEach( () => {
	queryClient.clear();
	fetchMock.mockClear();
	( runLocalGenerator as jest.Mock ).mockReset().mockReturnValue( new AbortController() );
	responses = {};
	latest = undefined;
	global.fetch = fetchMock as unknown as typeof global.fetch;
	setWindowState( running );
} );

describe( 'Critical CSS state poll', () => {
	it.each( [
		[ 'an earlier request', finishedEarlier, running ],
		[ 'an earlier snapshot of the same request', state( 'pending', 200, 199 ), running ],
		[
			'a later snapshot of the same request',
			state( 'pending', 200, 201, 'success' ),
			state( 'pending', 200, 201, 'success' ),
		],
		[ 'a later request', state( 'pending', 300, 300 ), state( 'pending', 300, 300 ) ],
		[
			'an older request the site wrote back after the held one',
			state( 'generated', 100, 400, 'success' ),
			state( 'generated', 100, 400, 'success' ),
		],
	] )( 'keeps the newer state when the poll returns %s', async ( _label, polled, expected ) => {
		const view = mount();
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state' ] = { body: polled };

		await act( () => queryClient.refetchQueries( { queryKey: [ 'critical_css_state' ] } ) );
		await settle();

		expect( fetchMock ).toHaveBeenCalled();
		expect( latest ).toEqual( expected );
		view.unmount();
	} );

	it( 'still accepts a state without a request time, such as an error reset', async () => {
		const view = mount();

		await act( async () => {
			queryClient.setQueryData( [ 'critical_css_state' ], errorState );
		} );
		await settle();

		expect( latest ).toEqual( errorState );
		view.unmount();
	} );
} );

describe( 'Regenerate reply', () => {
	it( 'keeps reporting a reply that did not start a new request when the re-read returns the old state', async () => {
		setWindowState( finishedEarlier );
		const view = mount();
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state/action/request-regenerate' ] = {
			body: { success: true, state: finishedEarlier },
		};
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state' ] = { body: finishedEarlier };

		await act( async () => regenerate() );
		await settle();
		await act( () => queryClient.refetchQueries( { queryKey: [ 'critical_css_state' ] } ) );
		await settle();

		expect( latest ).toMatchObject( {
			status: 'error',
			status_error: 'Critical CSS generation did not start. Reload the page and try again.',
		} );
		view.unmount();
	} );

	it( 'ignores an old copy polled while the Regenerate request is still in flight', async () => {
		setWindowState( finishedEarlier );
		const view = mount();
		const started = state( 'pending', 300, 300 );
		let release: () => void = () => {};
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state/action/request-regenerate' ] = {
			body: { success: true, state: started },
			gate: new Promise< void >( resolve => {
				release = resolve;
			} ),
		};
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state' ] = { body: finishedEarlier };

		await act( async () => regenerate() );
		await act( () => queryClient.refetchQueries( { queryKey: [ 'critical_css_state' ] } ) );
		await settle();
		expect( latest ).toMatchObject( { status: 'pending', providers: [] } );

		responses[ '/wp-json/jetpack-boost-ds/critical-css-state' ] = { body: started };
		release();
		await settle();
		expect( latest ).toEqual( started );
		view.unmount();
	} );

	it( 'accepts the new pending request', async () => {
		const view = mount();
		const started = state( 'pending', 300, 300 );
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state/action/request-regenerate' ] = {
			body: { success: true, state: started },
		};
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state' ] = { body: started };

		await act( async () => regenerate() );
		await settle();

		expect( latest ).toEqual( started );
		view.unmount();
	} );
} );

// The dashboard as the modern Settings surface renders it, with the real store and data-sync client.
function mountDashboard() {
	return render(
		<ModuleSurfaceProvider value="row">
			<DataSyncProvider>
				<CriticalCssProvider>
					<CriticalCssMeta />
				</CriticalCssProvider>
			</DataSyncProvider>
		</ModuleSurfaceProvider>
	);
}

describe( 'Refused replies', () => {
	it( 'shows the host check page a Regenerate request got instead of silently reverting', async () => {
		setWindowState( finishedEarlier );
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state/action/request-regenerate' ] = {
			html: checkPage,
		};
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state' ] = { body: finishedEarlier };
		const view = mountDashboard();

		// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
		fireEvent.click( screen.getByRole( 'button', { name: 'Regenerate' } ) );

		await expect(
			screen.findByText( 'Critical CSS generation did not start' )
		).resolves.not.toBeNull();
		expect(
			screen.getByText(
				'The site answered HTTP 200 with a page instead of a reply from Boost: One moment, please... Checking your browser'
			)
		).not.toBeNull();
		// The old result stays on screen and Regenerate can be tried again once the state was re-read.
		expect( screen.getByText( /1 file generated/ ) ).not.toBeNull();
		await settle();
		expect(
			screen.getByRole< HTMLButtonElement >( 'button', { name: 'Regenerate' } ).disabled
		).toBe( false );

		// A run that did start, from anywhere, retires the notice.
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state' ] = {
			body: state( 'pending', 300, 300 ),
		};
		await act( () => queryClient.refetchQueries( { queryKey: [ 'critical_css_state' ] } ) );
		await settle();
		expect( screen.queryByText( 'Critical CSS generation did not start' ) ).toBeNull();
		view.unmount();
	} );

	it( 'names the refused save that stopped a run', async () => {
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state/action/set-provider-css' ] = refused;
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state/action/set-provider-errors' ] =
			refused;
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state/set' ] = refused;
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state' ] = { body: running };
		const view = mountDashboard();
		const callbacks = ( runLocalGenerator as jest.Mock ).mock.calls.at( -1 )[ 2 ];

		const saveError = await callbacks
			.setProviderCss( 'core_front_page', '.top{color:red}' )
			.catch( ( error: Error ) => error );
		const recordError = await callbacks
			.setProviderErrors( 'core_front_page', [] )
			.catch( ( error: Error ) => error );
		expect( saveError ).toBeInstanceOf( Error );
		await act( async () => {
			callbacks.onError( recordError );
			callbacks.onFinished( false );
		} );

		await expect( screen.findByText( 'Failed to generate Critical CSS' ) ).resolves.not.toBeNull();
		expect(
			screen.getByText( 'Error: The site answered with HTTP 502 Bad Gateway: 502 Bad Gateway' )
		).not.toBeNull();

		// Refresh on the stopped-run view is a Regenerate too; a refused one shows the same notice.
		responses[ '/wp-json/jetpack-boost-ds/critical-css-state/action/request-regenerate' ] = {
			html: checkPage,
		};
		// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
		fireEvent.click( screen.getByRole( 'button', { name: 'Refresh' } ) );
		await expect(
			screen.findByText( 'Critical CSS generation did not start' )
		).resolves.not.toBeNull();
		expect( screen.getByText( 'Failed to generate Critical CSS' ) ).not.toBeNull();
		view.unmount();
	} );
} );
