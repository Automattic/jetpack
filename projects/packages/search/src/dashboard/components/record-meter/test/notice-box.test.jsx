/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { NoticeBox } from 'components/record-meter/notice-box';
import React from 'react';

describe( 'with notices to display', () => {
	test( 'unable to locate content notice is displayed when not yet indexed', () => {
		render(
			<NoticeBox
				recordCount={ 20 }
				tierMaximumRecords={ 100 }
				hasBeenIndexed={ false }
				hasValidData={ true }
				hasItems={ true }
			></NoticeBox>
		);
		expect( screen.getByText( /locate any content/i ) ).toBeVisible();
	} );

	test( 'unable to access data notice is displayed', () => {
		render(
			<NoticeBox
				recordCount={ 20 }
				tierMaximumRecords={ 100 }
				hasBeenIndexed={ true }
				hasValidData={ false }
				hasItems={ true }
			></NoticeBox>
		);

		expect( screen.getByText( /index your content/i ) ).toBeVisible();
	} );

	test( 'unable to locate content notice is displayed when there are no items', () => {
		render(
			<NoticeBox
				recordCount={ 20 }
				tierMaximumRecords={ 100 }
				hasBeenIndexed={ true }
				hasValidData={ true }
				hasItems={ false }
			></NoticeBox>
		);

		expect( screen.getByText( /locate any content/i ) ).toBeVisible();
	} );
	test( 'getting close to record limit notice is displayed', () => {
		render(
			<NoticeBox
				recordCount={ 95 }
				tierMaximumRecords={ 100 }
				hasBeenIndexed={ true }
				hasValidData={ true }
				hasItems={ true }
			></NoticeBox>
		);

		expect( screen.getByText( /close to the maximum records/i ) ).toBeVisible();
	} );
} );

test( "with no notices to display, notice box container doesn't render", () => {
	render(
		<NoticeBox
			recordCount={ 20 }
			tierMaximumRecords={ 100 }
			hasBeenIndexed={ true }
			hasValidData={ true }
			hasItems={ true }
		></NoticeBox>
	);

	const noticeBoxMessage = screen.queryByTestId( 'notice-box' );
	expect( noticeBoxMessage ).not.toBeInTheDocument();
} );
