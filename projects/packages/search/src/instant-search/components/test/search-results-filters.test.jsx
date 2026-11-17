import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchResults from '../search-results';

jest.mock( '../answers-panel', () => () => null );
jest.mock( '../jetpack-colophon', () => () => null );
jest.mock( '../search-form', () => () => null );
jest.mock( '../sidebar', () => () => (
	<label htmlFor="test-article-filter">
		<input id="test-article-filter" type="checkbox" />
		Articles
	</label>
) );
jest.mock( '../search-result', () => () => (
	<li>
		<a href="https://example.com/result">Example result</a>
	</li>
) );
jest.mock( '../tabbed-search-filters', () => () => null );

it.each( [ 'click', 'Enter', ' ' ] )(
	'updates the filters disclosure state using %s',
	async input => {
		const user = userEvent.setup();
		render(
			<SearchResults response={ {} } searchQuery="" widgets={ [ {} ] } highlightColor="#ffffff" />
		);
		const toggle = screen.getByRole( 'button', { name: 'Filters' } );
		expect( screen.getByTestId( 'search-results-secondary' ) ).toHaveAttribute(
			'id',
			toggle.getAttribute( 'aria-controls' )
		);
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );

		const activate = async () => {
			if ( input === 'click' ) {
				await user.click( toggle );
			} else {
				toggle.focus();
				await user.keyboard( input === 'Enter' ? '{Enter}' : ' ' );
			}
		};

		await activate();
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'true' );
		await activate();
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
	}
);

it( 'tabs through filters before search results when the panel is opened', async () => {
	const user = userEvent.setup();
	render(
		<SearchResults
			response={ { total: 1, results: [ {} ] } }
			searchQuery="example"
			widgets={ [ {} ] }
			highlightColor="#ffffff"
		/>
	);

	await user.tab();
	expect( screen.getByRole( 'button', { name: 'Close search results' } ) ).toHaveFocus();
	await user.tab();
	expect( screen.getByRole( 'button', { name: 'Filters' } ) ).toHaveFocus();
	await user.keyboard( '{Enter}' );
	await user.tab();
	expect( screen.getByRole( 'checkbox', { name: 'Articles' } ) ).toHaveFocus();
	await user.tab();
	expect( screen.getByRole( 'link', { name: 'Example result' } ) ).toHaveFocus();
} );
