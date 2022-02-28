/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
// import { JSDOM } from 'jsdom';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { getSearchInputs } from '../dom';

describe( 'getSearchInputs', () => {
	beforeAll( () => {
		// timed-memoize uses setTimeout.
		jest.useFakeTimers();
	} );

	afterEach( () => {
		// Evict timed-memoize cache.
		jest.runAllTimers();
	} );

	test( 'includes search inputs from GET forms', () => {
		// Add an example admin bar search form and a barebones GET search form.
		document.body.innerHTML = `
			<form action="https://example.com/" method="get" id="adminbarsearch">
				<input class="adminbar-input" name="s" id="adminbar-search" type="text" value="" maxlength="150">
				<input type="submit" class="adminbar-button" value="Search">
			</form>
			<form action="https://example.com/" method="get">
				<input type="hidden" name="s" value="">
				<input type="submit">
			</form>
		`;
		expect( getSearchInputs().length ).toEqual( 2 );
	} );

	test( 'filters out GeoDirectory plugin forms', () => {
		// Add a GeoDirectory form to the body.
		document.body.innerHTML = `
			<form action="https://example.com/" method="get" class="geodir-listing-search gd-search-bar-style" name="geodir-listing-search">
				<input name="s" type="text" value="">
				<input type="submit" class="adminbar-button" value="Search">
			</form>
		`;
		expect( getSearchInputs().length ).toEqual( 0 );
	} );

	test( 'filters out forms with POST actions', () => {
		// Add a POST form to the body.
		document.body.innerHTML = `
			<form action="https://example.com/" method="post">
				<input type="hidden" name="s" value="">
				<input type="submit">
			</form>
		`;
		expect( getSearchInputs().length ).toEqual( 0 );
	} );
} );
