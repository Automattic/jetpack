import { render } from '@testing-library/react';
import { useContext, useEffect } from 'react';
import { NOTICE_PRIORITY_HIGH, NOTICE_PRIORITY_MEDIUM } from '../../constants';
import NoticeContextProvider, { NoticeContext } from '../noticeContext';

describe( 'NoticeContextProvider', () => {
	it( 'keeps the higher-priority notice when a lower one is set later in the same effect pass', () => {
		const rendered: string[] = [];

		const Watchers = () => {
			const { setNotice } = useContext( NoticeContext );
			useEffect( () => {
				setNotice( {
					message: 'High',
					options: { level: 'error', priority: NOTICE_PRIORITY_HIGH },
				} );
				setNotice( {
					message: 'Medium',
					options: { level: 'error', priority: NOTICE_PRIORITY_MEDIUM },
				} );
			}, [ setNotice ] );
			return null;
		};

		const CurrentNotice = () => {
			const { currentNotice } = useContext( NoticeContext );
			if ( currentNotice.message ) {
				rendered.push( String( currentNotice.message ) );
			}
			return null;
		};

		render(
			<NoticeContextProvider>
				<Watchers />
				<CurrentNotice />
			</NoticeContextProvider>
		);

		expect( rendered ).toEqual( [ 'High' ] );
	} );
} );
