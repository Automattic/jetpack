import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorNotice from '../components/error-notice';

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: ( blockName, contentObj ) => ( { blockName, contentObj } ),
} ) );

describe( 'ErrorNotice', () => {
	const onClick = jest.fn();

	const defaultProps = {
		onClick,
		fallbackUrl: 'https://rain.drops/keep/falling',
	};

	beforeEach( () => {
		onClick.mockClear();
	} );

	test( 'calls onClick when clicking button', async () => {
		const user = userEvent.setup();
		render( <ErrorNotice { ...defaultProps } /> );
		await user.click( screen.getByText( 'Convert block to link' ) );
		expect( onClick ).toHaveBeenCalledWith( {
			blockName: 'core/paragraph',
			contentObj: {
				content: `<a href="${ defaultProps.fallbackUrl }">${ defaultProps.fallbackUrl }</a>`,
			},
		} );
	} );
} );
