/* eslint-disable testing-library/no-node-access */
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { NoticeProvider, useNotices } from './context';
import NoticeManager from './manager';
import styles from './manager.module.scss';

jest.mock( './manager.module.scss', () => ( {
	wrapper: 'legacy-wrapper',
	modern: 'modern-wrapper',
} ) );

function TestNotice() {
	const { setNotice } = useNotices();
	useEffect( () => {
		setNotice( { id: 'test', type: 'success', message: 'Saved settings.' } );
	}, [ setNotice ] );
	return null;
}

test( 'swaps the layout class in modern mode while retaining the shared notice host', () => {
	const dashboard = ( modern?: boolean ) => (
		<NoticeProvider>
			<TestNotice />
			<NoticeManager modern={ modern } />
		</NoticeProvider>
	);
	const { rerender } = render( dashboard() );
	const host = screen
		.getByText( 'Saved settings.', { selector: '.components-snackbar__content' } )
		.closest( '.stackable-snackbars' );
	expect( host?.classList.contains( styles.wrapper ) ).toBe( true );
	expect( host?.classList.contains( styles.modern ) ).toBe( false );
	rerender( dashboard( true ) );
	expect(
		screen
			.getByText( 'Saved settings.', { selector: '.components-snackbar__content' } )
			.closest( '.stackable-snackbars' )
	).toBe( host );
	expect( host?.classList.contains( styles.modern ) ).toBe( true );
	expect( host?.classList.contains( styles.wrapper ) ).toBe( false );
} );
