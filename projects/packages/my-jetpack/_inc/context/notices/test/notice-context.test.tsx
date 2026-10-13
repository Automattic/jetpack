import { render } from '@testing-library/react';
import { useContext, useEffect } from 'react';
import { NOTICE_PRIORITY_HIGH, NOTICE_PRIORITY_MEDIUM } from '../../constants';
import NoticeContextProvider, { NoticeContext } from '../noticeContext';

describe( 'NoticeContextProvider', () => {
	it.each( [
		[
			'keeps the higher-priority notice when a lower one follows',
			NOTICE_PRIORITY_MEDIUM,
			[ 'First' ],
		],
		[
			'keeps the first notice when an equal-priority one follows',
			NOTICE_PRIORITY_HIGH,
			[ 'First' ],
		],
	] )( '%s in the same effect pass', ( _, secondPriority, expected ) => {
		const rendered: string[] = [];

		const Watchers = () => {
			const { setNotice } = useContext( NoticeContext );
			useEffect( () => {
				setNotice( {
					message: 'First',
					options: { level: 'error', priority: NOTICE_PRIORITY_HIGH },
				} );
				setNotice( {
					message: 'Second',
					options: { level: 'error', priority: secondPriority },
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

		expect( rendered ).toEqual( expected );
	} );
} );
