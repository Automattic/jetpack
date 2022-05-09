/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { NoticeBox } from 'components/record-meter/notice-box';

describe( 'with notices to display', () => {
	test( 'not-indexed notice is displayed', () => {
		render(
			<NoticeBox
				recordCount={ 20 }
				tierMaximumRecords={ 100 }
				hasBeenIndexed={ false }
				hasValidData={ true }
				hasItems={ true }
			></NoticeBox>
		);
		expect( screen.getByText( /not yet been indexed/i ) ).toBeVisible();
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

		expect( screen.getByText( /locate your content/i ) ).toBeVisible();
	} );

	test( 'unable to locate content notice is displayed', () => {
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

	test( 'recently surpassed record limit notice is displayed', () => {
		render(
			<NoticeBox
				recordCount={ 120 }
				tierMaximumRecords={ 100 }
				hasBeenIndexed={ true }
				hasValidData={ true }
				hasItems={ true }
			></NoticeBox>
		);

		expect( screen.getByText( /automatically upgraded to the next billing tier/i ) ).toBeVisible();
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

		expect( screen.getByText( /close to the max amount of records/i ) ).toBeVisible();
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
