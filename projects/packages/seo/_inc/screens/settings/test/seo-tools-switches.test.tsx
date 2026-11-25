import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

const setActive = jest.fn();
const turnOn = () => setActive( true );

const { default: SeoToolsOffNotice } = await import( '../seo-tools-off-notice' );
const { default: SeoToolsCard } = await import( '../seo-tools-card' );

describe( 'SEO tools switches', () => {
	beforeEach( () => setActive.mockClear() );

	it( 'turns SEO tools on from the off notice', () => {
		render( <SeoToolsOffNotice onTurnOn={ turnOn } disabled={ false } loading={ false } /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep.
		fireEvent.click( screen.getByRole( 'button', { name: 'Turn on SEO tools' } ) );

		expect( setActive ).toHaveBeenCalledWith( true );
	} );

	it.each( [ true, false ] )(
		'flips SEO tools from the Settings card when active is %s',
		active => {
			render( <SeoToolsCard active={ active } onChange={ setActive } disabled={ false } /> );

			// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep.
			fireEvent.click( screen.getByRole( 'button', { name: 'SEO tools' } ) );
			// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep.
			fireEvent.click( screen.getByRole( 'switch', { name: 'Use SEO tools', checked: active } ) );

			expect( setActive.mock.calls[ 0 ]?.[ 0 ] ).toBe( ! active );
		}
	);
} );
