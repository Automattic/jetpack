/* eslint-disable testing-library/prefer-user-event -- user-event is not a dependency of this package. */
import { fireEvent, render, screen } from '@testing-library/react';
import BulkRemoveNotice from '../_inc/subscribers/components/bulk-remove-notice';
import type { BulkRemoveJob } from '../_inc/subscribers/data/types';

const now = () => Math.floor( Date.now() / 1000 );

const buildJob = ( overrides: Partial< BulkRemoveJob > = {} ): BulkRemoveJob =>
	( {
		id: 7,
		blog_id: 1,
		status: 'removing',
		stalled: false,
		filters: [ 'all' ],
		search: '',
		cancel_paid: true,
		created_at: now() - 60,
		updated_at: now(),
		finished_at: null,
		total: 15000,
		processed: 6000,
		removed: 6000,
		failed: 0,
		skipped_paid: 0,
		counts_before: null,
		counts_after: null,
		has_backup: true,
		...overrides,
	} ) as BulkRemoveJob;

beforeEach( () => {
	window.localStorage.clear();
} );

describe( 'BulkRemoveNotice', () => {
	it( 'shows nothing without a job', () => {
		const { container } = render( <BulkRemoveNotice job={ null } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows progress while removing', () => {
		render( <BulkRemoveNotice job={ buildJob() } /> );

		expect(
			screen.getByText(
				'Removing 15,000 subscribers. This can take a few minutes, and you can leave this page.'
			)
		).toBeInTheDocument();
		expect( screen.getByText( '6,000 of 15,000' ) ).toBeInTheDocument();
	} );

	it( 'says "matching" for a filtered removal, and that the backup comes first', () => {
		render(
			<BulkRemoveNotice
				job={ buildJob( { status: 'backing_up', filters: [ 'free' ], total: 1200, processed: 0 } ) }
			/>
		);

		expect( screen.getByText( /Removing 1,200 matching subscribers\./ ) ).toBeInTheDocument();
		expect( screen.getByText( 'Saving a backup first…' ) ).toBeInTheDocument();
	} );

	it( 'reports what was removed and what is left, and stays closed once dismissed', () => {
		const job = buildJob( {
			status: 'done',
			processed: 15000,
			removed: 14998,
			failed: 2,
			finished_at: now() - 30,
			counts_after: { total: 2, wpcom: 0, email: 2, pending: 0, paid: 0 },
		} );
		const { rerender } = render( <BulkRemoveNotice job={ job } /> );

		expect(
			screen.getByText(
				'Removed 14,998 subscribers. 2 subscribers could not be removed. 2 subscribers are still on your list.'
			)
		).toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button' ) );
		rerender( <BulkRemoveNotice job={ job } /> );
		expect( screen.queryByText( /Removed 14,998/ ) ).not.toBeInTheDocument();
	} );

	it( 'says the list is empty after removing everyone', () => {
		render(
			<BulkRemoveNotice
				job={ buildJob( {
					status: 'done',
					processed: 15000,
					removed: 15000,
					finished_at: now(),
					counts_after: { total: 0, wpcom: 0, email: 0, pending: 0, paid: 0 },
				} ) }
			/>
		);

		expect(
			screen.getByText( 'Removed 15,000 subscribers. Your list is now empty.' )
		).toBeInTheDocument();
	} );

	it( 'says where a stalled removal stopped', () => {
		render( <BulkRemoveNotice job={ buildJob( { stalled: true, updated_at: now() - 7200 } ) } /> );

		expect(
			screen.getByText( /The removal stopped after removing 6,000 of 15,000 subscribers\./ )
		).toBeInTheDocument();
	} );

	it( 'hides a removal that finished more than a day ago', () => {
		const { container } = render(
			<BulkRemoveNotice job={ buildJob( { status: 'done', finished_at: now() - 2 * 86400 } ) } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
