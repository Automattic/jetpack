import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addFilter, removeAllFilters } from '@wordpress/hooks';
import { useContext, useEffect, useRef } from 'react';
import NoticeContextProvider, { NoticeContext } from '../../../context/notices/noticeContext';
import useFilteredNotices from '../use-filtered-notices';

// Sets a higher-priority notice once.
const Connection = () => {
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const hasSet = useRef( false );
	useEffect( () => {
		if ( ! hasSet.current ) {
			hasSet.current = true;
			setNotice( {
				title: 'Connection',
				message: 'Broken',
				options: { level: 'error', priority: 300, onClose: resetNotice },
			} );
		}
	}, [ setNotice, resetNotice ] );
	return null;
};

const Screen = () => {
	const { currentNotice } = useContext( NoticeContext );
	useFilteredNotices( false );

	return (
		<>
			<p>{ currentNotice.title }</p>
			<button onClick={ currentNotice.options.onClose }>close</button>
		</>
	);
};

const renderScreen = ( { withConnection = false } = {} ) =>
	render(
		<NoticeContextProvider>
			{ withConnection && <Connection /> }
			<Screen />
		</NoticeContextProvider>
	);

const addNotice = ( id: string, onClose = jest.fn() ) =>
	addFilter( 'myJetpack.notices', 'test', ( notices: unknown[] ) => [
		...notices,
		{ title: 'Expiry', message: 'Renew', options: { id, level: 'error', priority: 200, onClose } },
	] );

describe( 'useFilteredNotices', () => {
	afterEach( () => removeAllFilters( 'myJetpack.notices', 'test' ) );

	it( 'yields to a higher-priority notice, then returns once it closes', async () => {
		const user = userEvent.setup();
		addNotice( 'expiry-a' );
		renderScreen( { withConnection: true } );
		expect( screen.getByText( 'Connection' ) ).toBeInTheDocument();

		await user.click( screen.getByText( 'close' ) );
		expect( screen.getByText( 'Expiry' ) ).toBeInTheDocument();
	} );

	it( 'keeps a closed notice closed when the screen remounts', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		addNotice( 'expiry-b', onClose );
		const { unmount } = renderScreen();

		await user.click( screen.getByText( 'close' ) );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
		unmount();

		renderScreen();
		expect( screen.queryByText( 'Expiry' ) ).not.toBeInTheDocument();
	} );
} );
