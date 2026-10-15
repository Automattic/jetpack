/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getNoticeAnnouncement } from '../../../../../../tests/js/notice-test-utils';
import { PageNotice } from '../page-notice';

describe( 'PageNotice', () => {
	it.each( [
		[ 'assertively by default', undefined, 'assertive' ],
		[ 'politely for info', 'info', 'polite' ],
	] as const )( 'announces %s', ( _, intent, politeness ) => {
		render( <PageNotice intent={ intent } description="Something happened." /> );

		expect( getNoticeAnnouncement( 'Something happened.', politeness ) ).toBeInTheDocument();
	} );
} );
