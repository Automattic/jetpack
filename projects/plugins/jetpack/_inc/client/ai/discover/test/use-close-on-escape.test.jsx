import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useCloseOnEscape from '../use-close-on-escape';

/**
 * Mounts the hook with whatever page around it the test needs.
 *
 * @param {object}   props          - Component props.
 * @param {Function} props.onClose  - Passed to the hook.
 * @param {object}   props.children - The rest of the page.
 * @return {object} Component markup.
 */
function Page( { onClose, children } ) {
	useCloseOnEscape( onClose );
	return children;
}

let user;

// Escape pressed with focus on the target.
const escape = async target => {
	target.focus();
	await user.keyboard( '{Escape}' );
};

describe( 'useCloseOnEscape', () => {
	beforeEach( () => {
		user = userEvent.setup();
	} );

	test( 'closes on Escape from anywhere on the page', async () => {
		const onClose = jest.fn();
		render( <Page onClose={ onClose }>{ <button>Somewhere</button> }</Page> );

		await escape( screen.getByRole( 'button' ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'leaves Escape to a search box with words in it, then closes once it is empty', async () => {
		const onClose = jest.fn();
		render(
			<Page onClose={ onClose }>
				<input type="search" aria-label="Search skills" defaultValue="seo" />
			</Page>
		);
		const search = screen.getByRole( 'searchbox' );

		await escape( search );
		expect( onClose ).not.toHaveBeenCalled();

		await user.clear( search );
		await escape( search );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'leaves Escape to a dialog open elsewhere on the page', async () => {
		const onClose = jest.fn();
		render(
			<Page onClose={ onClose }>
				<button>Behind</button>
				<div role="dialog" aria-label="Confirm" />
			</Page>
		);

		await escape( screen.getByRole( 'button', { name: 'Behind' } ) );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	test( 'leaves Escape to a trigger whose menu is open', async () => {
		const onClose = jest.fn();
		render(
			<Page onClose={ onClose }>
				<button aria-haspopup="menu" aria-expanded="true">
					Send to agent
				</button>
			</Page>
		);

		await escape( screen.getByRole( 'button' ) );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	test( 'a plain disclosure, the admin bar’s menus, and a handled key don’t count', async () => {
		const onClose = jest.fn();
		render(
			<Page onClose={ onClose }>
				<button aria-expanded="true">More</button>
				<div id="wpadminbar">
					<ul role="menu" />
				</div>
			</Page>
		);
		const disclosure = screen.getByRole( 'button' );

		await escape( disclosure );
		expect( onClose ).toHaveBeenCalledTimes( 1 );

		disclosure.addEventListener( 'keydown', event => event.preventDefault(), { once: true } );
		await escape( disclosure );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );
} );
