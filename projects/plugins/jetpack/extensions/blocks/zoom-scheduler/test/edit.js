import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZoomSchedulerEdit } from '../edit';

describe( 'ZoomSchedulerEdit', () => {
	const defaultAttributes = {
		url: 'https://scheduler.zoom.us/test-user/discovery-call',
	};

	const createErrorNotice = jest.fn();
	const removeAllNotices = jest.fn();
	const setAttributes = jest.fn();

	const defaultProps = {
		attributes: { ...defaultAttributes },
		setAttributes,
		clientId: 1,
		isSelected: true,
		name: 'jetpack/zoom-scheduler',
		noticeOperations: {
			removeAllNotices,
			createErrorNotice,
		},
	};

	beforeEach( () => {
		createErrorNotice.mockClear();
		removeAllNotices.mockClear();
		setAttributes.mockClear();
	} );

	test( 'displays placeholder when no URL is set', () => {
		render(
			<ZoomSchedulerEdit
				{ ...{
					...defaultProps,
					attributes: { url: undefined },
				} }
			/>
		);

		expect( screen.getByText( 'Zoom Scheduler' ) ).toBeInTheDocument();
		expect(
			screen.getAllByText( 'Paste your Zoom Scheduler booking page URL below.' )[ 0 ]
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText( 'https://scheduler.zoom.us/your-name/discovery-call' )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', {
				name: 'Find your Zoom Scheduler booking page URL(opens in a new tab)',
			} )
		).toHaveAttribute(
			'href',
			'https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0083594'
		);
	} );

	test( 'rejects iframe embed code', async () => {
		const user = userEvent.setup();

		render(
			<ZoomSchedulerEdit
				{ ...{
					...defaultProps,
					attributes: { url: undefined },
				} }
			/>
		);

		const input = screen.getByPlaceholderText(
			'https://scheduler.zoom.us/your-name/discovery-call'
		);
		const button = screen.getByRole( 'button', { name: 'Embed' } );

		await user.type(
			input,
			'<iframe src="https://scheduler.zoom.us/test-user/discovery-call?embed=true"></iframe>'
		);
		await user.click( button );

		expect( createErrorNotice ).toHaveBeenCalledWith(
			"Your calendar couldn't be embedded. Please double check your URL or code."
		);
		expect( removeAllNotices ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'stores a normalized Zoom Scheduler URL', async () => {
		const user = userEvent.setup();

		render(
			<ZoomSchedulerEdit
				{ ...{
					...defaultProps,
					attributes: { url: undefined },
				} }
			/>
		);

		const input = screen.getByPlaceholderText(
			'https://scheduler.zoom.us/your-name/discovery-call'
		);
		const button = screen.getByRole( 'button', { name: 'Embed' } );

		await user.type( input, 'scheduler.zoom.us/test-user/discovery-call?month=2026-07' );
		await user.click( button );

		expect( setAttributes ).toHaveBeenCalledWith( {
			url: 'https://scheduler.zoom.us/test-user/discovery-call?month=2026-07',
		} );
		expect( removeAllNotices ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'renders an iframe preview with embed=true', () => {
		render( <ZoomSchedulerEdit { ...defaultProps } /> );

		const iframe = screen.getByTitle( 'Zoom Scheduler' );

		expect( iframe ).toBeInTheDocument();
		expect( iframe ).toHaveAttribute(
			'src',
			'https://scheduler.zoom.us/test-user/discovery-call?embed=true'
		);
	} );

	test( 'sandboxes the iframe preview', () => {
		render( <ZoomSchedulerEdit { ...defaultProps } /> );

		expect( screen.getByTitle( 'Zoom Scheduler' ) ).toHaveAttribute(
			'sandbox',
			'allow-scripts allow-same-origin allow-popups allow-forms'
		);
	} );
} );
