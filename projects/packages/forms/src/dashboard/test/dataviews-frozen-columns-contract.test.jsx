/**
 * Guards the DataViews table markup that the frozen answer columns are positioned against.
 *
 * DataViews offers no supported way to pin a column. The primary (title) `th` and `td` carry
 * no class of their own, `<col>` elements accept no `position: sticky`, and
 * `view.layout.styles` is read only for non-primary columns — so
 * `_response-field-columns.scss` reaches into DataViews' internal table markup instead.
 *
 * Nothing about that CSS fails loudly when the markup moves. The columns simply stop
 * freezing, and no one notices until someone scrolls a wide table sideways. These tests
 * stand in for the contract DataViews does not publish, so that an upgrade which changes the
 * table's shape fails here rather than in front of a user.
 *
 * If one of these fails after a DataViews upgrade: fix the selectors in
 * `_response-field-columns.scss` first, then update the test to describe the new markup.
 */

/* eslint-disable testing-library/no-container, testing-library/no-node-access --
   These tests assert on DOM structure deliberately. Testing Library's queries describe what
   a user perceives, and what is guarded here is precisely what a user cannot perceive: which
   element carries which internal DataViews class, and that the title cell is the checkbox
   cell's next sibling with no class of its own. Saying that is the whole point of the file.
*/

import { render } from '@testing-library/react';
import { DataViews } from '@wordpress/dataviews';

const DATA = [
	{ id: '1', from: 'Ada Lovelace', answer: 'Yes' },
	{ id: '2', from: 'Alan Turing', answer: 'No' },
];

const renderFrom = ( { item } ) => item.from;
const renderAnswer = ( { item } ) => item.answer;

const FIELDS = [
	{ id: 'from', label: 'From', render: renderFrom },
	{ id: 'answer', label: 'Answer', render: renderAnswer },
];

const VIEW = {
	type: 'table',
	titleField: 'from',
	fields: [ 'answer' ],
	page: 1,
	perPage: 10,
};

// DataViews only draws the checkbox column when some row has a possible bulk action, and
// only then flags the table `has-bulk-actions`. The frozen columns are offset by that
// column's width, so both have to be true for the stylesheet to apply.
const ACTIONS = [ { id: 'trash', label: 'Trash', supportsBulk: true, callback: () => {} } ];

const noop = () => {};
const getItemId = item => item.id;
const paginationInfo = { totalItems: DATA.length, totalPages: 1 };

const renderTable = ( { selection = [] } = {} ) =>
	render(
		<DataViews
			data={ DATA }
			fields={ FIELDS }
			view={ VIEW }
			onChangeView={ noop }
			paginationInfo={ paginationInfo }
			getItemId={ getItemId }
			selection={ selection }
			onChangeSelection={ noop }
			actions={ ACTIONS }
		>
			<DataViews.Layout className="has-field-columns" />
		</DataViews>
	);

describe( 'DataViews frozen-column markup contract', () => {
	it( 'flags the table as having a checkbox column, alongside our own class', () => {
		const { container } = renderTable();
		const table = container.querySelector( 'table.dataviews-view-table' );

		// `.dataviews-view-table.has-bulk-actions.has-field-columns` is the stylesheet's
		// entry point, so all three have to land on the same element.
		expect( table ).toHaveClass( 'dataviews-view-table' );
		expect( table ).toHaveClass( 'has-bulk-actions' );
		expect( table ).toHaveClass( 'has-field-columns' );
	} );

	it( 'names the checkbox cell in both the header and every body row', () => {
		const { container } = renderTable();

		expect(
			container.querySelector( 'thead th.dataviews-view-table__checkbox-column' )
		).not.toBeNull();
		expect(
			container.querySelectorAll( 'tbody td.dataviews-view-table__checkbox-column' )
		).toHaveLength( DATA.length );
	} );

	it( 'gives the checkbox column a sizable <col>, which the frozen offset is pinned to', () => {
		// The stylesheet sizes this `<col>` so that the offset it moves the title column
		// by, and the width of the column beside it, come from one value — rather than the
		// offset being a guess at DataViews' padding.
		const { container } = renderTable();

		expect(
			container.querySelector( 'colgroup col.dataviews-view-table__col-checkbox' )
		).not.toBeNull();
	} );

	it( 'places the title cell immediately after the checkbox cell, and leaves it unnamed', () => {
		// This is the entire reason the stylesheet uses an adjacent-sibling selector: the
		// title cell has no class to target. Should DataViews ever give it one, the
		// selector should move to that class and this test should say so.
		const { container } = renderTable();

		const headerTitle = container.querySelector(
			'thead th.dataviews-view-table__checkbox-column'
		).nextElementSibling;

		expect( headerTitle.tagName ).toBe( 'TH' );
		expect( headerTitle ).toHaveTextContent( 'From' );
		expect( headerTitle ).not.toHaveAttribute( 'class' );

		const bodyTitle = container.querySelector(
			'tbody td.dataviews-view-table__checkbox-column'
		).nextElementSibling;

		expect( bodyTitle.tagName ).toBe( 'TD' );
		expect( bodyTitle ).toHaveTextContent( 'Ada Lovelace' );
		expect( bodyTitle ).not.toHaveAttribute( 'class' );
	} );

	it( 'tints a selected row on the tr, which the frozen cells have to repeat', () => {
		// A frozen cell paints its own background over the row's tint, so the stylesheet
		// restates the tint for `tr.is-selected` on both frozen columns. That only works
		// while the tint lives on the row.
		const { container } = renderTable( { selection: [ '1' ] } );
		const selectedRow = container.querySelector( 'tbody tr.is-selected' );

		expect( selectedRow ).not.toBeNull();
		expect(
			selectedRow.querySelector( 'td.dataviews-view-table__checkbox-column' )
		).not.toBeNull();
	} );
} );
