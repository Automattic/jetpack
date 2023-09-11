import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen } from 'test/test-utils';
import SupportInfo from '../index';

describe( 'SupportInfo', () => {
	const testProps = {
		text: 'Hello world!',
		link: 'https://foo.com/',
		privacyLink: 'https://foo.com/privacy/',
	};

	it( 'should have a proper "Learn more" link', async () => {
		const user = userEvent.setup();
		render( <SupportInfo { ...testProps } /> );
		await user.click( screen.getByRole( 'button', { name: 'Learn more' } ) );
		expect(
			screen.getByRole( 'link', { name: 'Learn more (opens in a new tab)' } )
		).toHaveAttribute( 'href', 'https://foo.com/' );
	} );

	it( 'should have a proper "Privacy Information" link', async () => {
		const user = userEvent.setup();
		render( <SupportInfo { ...testProps } /> );
		await user.click( screen.getByRole( 'button', { name: 'Learn more' } ) );
		expect(
			screen.getByRole( 'link', { name: 'Privacy information (opens in a new tab)' } )
		).toHaveAttribute( 'href', 'https://foo.com/privacy/' );
	} );
} );
