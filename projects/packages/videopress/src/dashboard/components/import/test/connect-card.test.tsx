import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectCard, { POPUP_WATCH_INTERVAL_MS } from '../connect-card';

describe( 'ConnectCard', () => {
	const connectUrl = 'https://public-api.example.com/connect/youtube';
	let onPollingChange: jest.Mock;
	let refetch: jest.Mock;
	let openSpy: jest.SpyInstance;

	beforeEach( () => {
		jest.useFakeTimers();
		onPollingChange = jest.fn();
		refetch = jest.fn();
		openSpy = jest.spyOn( window, 'open' );
	} );

	afterEach( () => {
		openSpy.mockRestore();
		jest.useRealTimers();
	} );

	const renderCard = ( url: string | null = connectUrl ) =>
		render(
			<ConnectCard connectUrl={ url } onPollingChange={ onPollingChange } refetch={ refetch } />
		);

	// The suite runs on fake timers (for the popup watcher), so userEvent
	// must advance them itself while waiting between events.
	const clickConnect = async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		await user.click( screen.getByRole( 'button', { name: 'Connect YouTube account' } ) );
	};

	it( 'opens the OAuth popup and starts polling', async () => {
		openSpy.mockReturnValue( { closed: false } as Window );
		renderCard();

		await clickConnect();

		expect( openSpy ).toHaveBeenCalledWith(
			connectUrl,
			'videopress-youtube-connect',
			expect.any( String )
		);
		expect( onPollingChange ).toHaveBeenCalledWith( true );
	} );

	it( 'stops polling and re-fetches once the popup closes', async () => {
		const popup = { closed: false } as { closed: boolean };
		openSpy.mockReturnValue( popup as Window );
		renderCard();

		await clickConnect();
		expect( onPollingChange ).toHaveBeenLastCalledWith( true );

		// Still open: the watcher keeps waiting.
		act( () => jest.advanceTimersByTime( POPUP_WATCH_INTERVAL_MS ) );
		expect( onPollingChange ).not.toHaveBeenCalledWith( false );

		popup.closed = true;
		act( () => jest.advanceTimersByTime( POPUP_WATCH_INTERVAL_MS ) );

		expect( onPollingChange ).toHaveBeenLastCalledWith( false );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'falls back to a refetch when there is no connect URL', async () => {
		renderCard( null );

		await clickConnect();

		expect( openSpy ).not.toHaveBeenCalled();
		expect( refetch ).toHaveBeenCalledTimes( 1 );
		expect( onPollingChange ).not.toHaveBeenCalled();
	} );

	it( 'does not start polling when the popup is blocked', async () => {
		openSpy.mockReturnValue( null );
		renderCard();

		await clickConnect();

		expect( onPollingChange ).not.toHaveBeenCalledWith( true );
	} );

	it( 'clears the watcher and polling flag on unmount', async () => {
		openSpy.mockReturnValue( { closed: false } as Window );
		const { unmount } = renderCard();

		await clickConnect();
		unmount();

		expect( onPollingChange ).toHaveBeenLastCalledWith( false );
		// The watcher is gone: nothing fires after unmount.
		refetch.mockClear();
		act( () => jest.advanceTimersByTime( POPUP_WATCH_INTERVAL_MS * 4 ) );
		expect( refetch ).not.toHaveBeenCalled();
	} );
} );
