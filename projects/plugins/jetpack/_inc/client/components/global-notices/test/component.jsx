import { createStore } from 'redux';
import { act, render, screen } from 'test/test-utils';
import NoticesList from '../index.jsx';
import { createNotice, removeNotice } from '../state/notices/actions';
import reducer from '../state/notices/reducer';

/**
 * Mount the notices list against a real notices store.
 *
 * @return {object} The store, so the test can dispatch into it.
 */
function mountNotices() {
	const store = createStore( reducer );
	render( <NoticesList />, { store } );
	return store;
}

describe( 'NoticesList', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'dismisses a notice that replaced an earlier one under the same id', () => {
		const store = mountNotices();

		act( () => {
			store.dispatch( createNotice( 'is-info', 'Testing your connection…', { id: 'connection' } ) );
			store.dispatch( createNotice( 'is-info', 'Activating Image CDN…', { id: 'module-toggle' } ) );
		} );
		expect( screen.getByText( 'Activating Image CDN…' ) ).toBeInTheDocument();

		act( () => {
			store.dispatch( removeNotice( 'module-toggle' ) );
			store.dispatch(
				createNotice( 'is-success', 'Image CDN has been activated.', {
					id: 'module-toggle',
					duration: 2000,
				} )
			);
		} );
		expect( screen.getByText( 'Image CDN has been activated.' ) ).toBeInTheDocument();

		act( () => {
			jest.advanceTimersByTime( 2000 );
		} );
		expect( screen.queryByText( 'Image CDN has been activated.' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Testing your connection…' ) ).toBeInTheDocument();
	} );

	it( 'dismisses a notice that replaced an earlier one under a different id', () => {
		const store = mountNotices();

		act( () => {
			store.dispatch( createNotice( 'is-info', 'Testing your connection…', { id: 'connection' } ) );
			store.dispatch( createNotice( 'is-info', 'Updating settings…', { id: 'setting-update' } ) );
		} );

		act( () => {
			store.dispatch( removeNotice( 'setting-update' ) );
			store.dispatch(
				createNotice( 'is-success', 'Updated settings.', {
					id: 'setting-update-success',
					duration: 2000,
				} )
			);
		} );
		expect( screen.getByText( 'Updated settings.' ) ).toBeInTheDocument();

		act( () => {
			jest.advanceTimersByTime( 2000 );
		} );
		expect( screen.queryByText( 'Updated settings.' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Testing your connection…' ) ).toBeInTheDocument();
	} );

	it( 'dismisses a notice added while another one is already on screen', () => {
		const store = mountNotices();

		act( () => {
			store.dispatch( createNotice( 'is-info', 'Testing your connection…', { id: 'connection' } ) );
		} );

		act( () => {
			store.dispatch(
				createNotice( 'is-success', 'Site is verified.', { id: 'verify', duration: 2000 } )
			);
		} );
		expect( screen.getByText( 'Site is verified.' ) ).toBeInTheDocument();

		act( () => {
			jest.advanceTimersByTime( 2000 );
		} );
		expect( screen.queryByText( 'Site is verified.' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Testing your connection…' ) ).toBeInTheDocument();
	} );
} );
