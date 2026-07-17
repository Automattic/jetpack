import { render, screen, within } from '@testing-library/react';
import { NoticeBox } from 'components/record-meter/notice-box';

// `@wordpress/ui` Notice uses `@wordpress/a11y` to announce notice content
// via live regions appended to `document.body` (`.a11y-speak-region`),
// so the same text appears twice in the DOM. Scope text queries to the
// rendered container to ignore the screen-reader announcement and match
// only the visible Notice content.
describe( 'with notices to display', () => {
	test( 'unable to locate content notice is displayed when not yet indexed', () => {
		const { container } = render(
			<NoticeBox
				recordCount={ 20 }
				tierMaximumRecords={ 100 }
				hasBeenIndexed={ false }
				hasValidData={ true }
				hasItems={ true }
			></NoticeBox>
		);
		expect( within( container ).getByText( /gathering your usage data/i ) ).toBeVisible();
	} );

	test( 'unable to access data notice is displayed', () => {
		const { container } = render(
			<NoticeBox
				recordCount={ 20 }
				tierMaximumRecords={ 100 }
				hasBeenIndexed={ true }
				hasValidData={ false }
				hasItems={ true }
			></NoticeBox>
		);

		expect( within( container ).getByText( /index your content/i ) ).toBeVisible();
	} );

	test( 'unable to locate content notice is displayed when there are no items', () => {
		const { container } = render(
			<NoticeBox
				recordCount={ 20 }
				tierMaximumRecords={ 100 }
				hasBeenIndexed={ true }
				hasValidData={ true }
				hasItems={ false }
			></NoticeBox>
		);

		expect( within( container ).getByText( /gathering your usage data/i ) ).toBeVisible();
	} );
	test( 'getting close to record limit notice is displayed', () => {
		const { container } = render(
			<NoticeBox
				recordCount={ 95 }
				tierMaximumRecords={ 100 }
				hasBeenIndexed={ true }
				hasValidData={ true }
				hasItems={ true }
			></NoticeBox>
		);

		expect( within( container ).getByText( /close to the maximum records/i ) ).toBeVisible();
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
