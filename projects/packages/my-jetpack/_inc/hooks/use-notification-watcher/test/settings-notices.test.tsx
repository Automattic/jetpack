import { renderHook } from '@testing-library/react';
import {
	NOTICE_PRIORITY_HIGH,
	NOTICE_PRIORITY_LOW,
	NOTICE_PRIORITY_MEDIUM,
} from '../../../context/constants';
import { NoticeContext } from '../../../context/notices/noticeContext';
import { assignLocation } from '../assignLocation';
import useJetpackStateNotice from '../use-jetpack-state-notice';
import useSearchVisibilityNotice from '../use-search-visibility-notice';
import type { NoticeContextType } from '../../../context/notices/types';
import type { ReactNode } from 'react';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
} ) );
jest.mock( '../assignLocation' );

const makeContext = () =>
	( {
		currentNotice: { message: '', options: { level: 'info', priority: 0 } },
		setNotice: jest.fn(),
		resetNotice: jest.fn(),
	} ) as unknown as NoticeContextType;

/**
 * Render a watcher hook with a notice context the test can read and replace.
 *
 * @param hook    - The hook.
 * @param notices - The `settingsNotices` initial state, or null while Settings keeps its notices.
 * @return The holder of the current context, and the render result.
 */
function renderWatcher( hook: () => void, notices: object | null ) {
	window.myJetpackInitialState = {
		settingsNotices: notices && {
			jetpackState: {},
			jetpackVersion: '16.5',
			searchEnginesVisible: true,
			...notices,
		},
	} as unknown as Window[ 'myJetpackInitialState' ];

	const holder = { context: makeContext() };
	const wrapper = ( { children }: { children: ReactNode } ) => (
		<NoticeContext.Provider value={ holder.context }>{ children }</NoticeContext.Provider>
	);

	return { holder, ...renderHook( hook, { wrapper } ) };
}

afterEach( () => {
	delete window.myJetpackInitialState;
	jest.clearAllMocks();
} );

it.each( [
	[ 'state', useJetpackStateNotice ],
	[ 'search visibility', useSearchVisibilityNotice ],
] )( 'leaves the %s notice to Settings while My Jetpack does not show it', ( _name, hook ) => {
	const { holder } = renderWatcher( hook, null );

	expect( holder.context.setNotice ).not.toHaveBeenCalled();
} );

describe( 'useJetpackStateNotice', () => {
	it.each( [
		[ 'an error', { error: 'wrong_state' }, 'error', NOTICE_PRIORITY_HIGH ],
		[ 'a message', { message: 'authorized' }, 'success', NOTICE_PRIORITY_MEDIUM ],
	] )( 'shows %s from the Jetpack state', ( _what, jetpackState, level, priority ) => {
		const { holder } = renderWatcher( useJetpackStateNotice, { jetpackState } );

		expect( holder.context.setNotice ).toHaveBeenCalledWith(
			expect.objectContaining( {
				options: expect.objectContaining( { id: 'jetpack-state-notice', level, priority } ),
			} )
		);
	} );

	it( 'skips a message code that has no copy', () => {
		const { holder } = renderWatcher( useJetpackStateNotice, {
			jetpackState: { message: 'module_deactivated' },
		} );

		expect( holder.context.setNotice ).not.toHaveBeenCalled();
	} );

	it( 'stays closed when the watchers run again', () => {
		const { holder, rerender } = renderWatcher( useJetpackStateNotice, {
			jetpackState: { error: 'wrong_state' },
		} );
		const { setNotice, resetNotice } = holder.context;

		( setNotice as jest.Mock ).mock.calls[ 0 ][ 0 ].options.onClose();
		// A new setNotice re-runs the watcher, as closing a notice does in the app.
		holder.context = makeContext();
		rerender();

		expect( resetNotice ).toHaveBeenCalled();
		expect( holder.context.setNotice ).not.toHaveBeenCalled();
	} );
} );

describe( 'useSearchVisibilityNotice', () => {
	it( 'warns when search engines are discouraged, and opens Reading settings', () => {
		const { holder } = renderWatcher( useSearchVisibilityNotice, { searchEnginesVisible: false } );

		const { options } = ( holder.context.setNotice as jest.Mock ).mock.calls[ 0 ][ 0 ];
		expect( options ).toMatchObject( { level: 'warning', priority: NOTICE_PRIORITY_LOW } );
		options.actions[ 0 ].onClick();
		expect( assignLocation ).toHaveBeenCalledWith(
			'https://example.com/wp-admin/options-reading.php'
		);
	} );

	it.each( [
		[ 'search engines are welcome', true ],
		[ 'the user cannot change it', null ],
	] )( 'stays quiet when %s', ( _when, searchEnginesVisible ) => {
		const { holder } = renderWatcher( useSearchVisibilityNotice, { searchEnginesVisible } );

		expect( holder.context.setNotice ).not.toHaveBeenCalled();
	} );
} );
