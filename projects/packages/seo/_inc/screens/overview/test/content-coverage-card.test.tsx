import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import ContentCoverageCard from '../content-coverage-card';
import type { ContentCoverage } from '../../../data/overview-types';

/**
 * Build a content-coverage payload. Defaults leave three metrics partially
 * covered (interactive rings) and search-visibility fully covered (static ring).
 *
 * @param overrides - Fields to override on the default payload.
 * @return The coverage payload.
 */
const buildCoverage = ( overrides: Partial< ContentCoverage > = {} ): ContentCoverage => ( {
	total: 10,
	with_schema: 3,
	with_title: 4,
	with_description: 5,
	with_search_visible: 10,
	...overrides,
} );

describe( 'ContentCoverageCard', () => {
	it( 'renders an interactive ring that deep-links to the unconfigured rows', () => {
		const onFilter = jest.fn();
		render(
			<ContentCoverageCard data={ buildCoverage() } onManage={ jest.fn() } onFilter={ onFilter } />
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn) for a single click.
		fireEvent.click( screen.getByRole( 'button', { name: /Set SEO titles/ } ) );

		expect( onFilter ).toHaveBeenCalledWith( 'title' );
	} );

	it( 'leaves a fully-covered ring static, since there is nothing to fix', () => {
		render(
			<ContentCoverageCard data={ buildCoverage() } onManage={ jest.fn() } onFilter={ jest.fn() } />
		);

		// with_search_visible === total, so the "Visible to search engines" ring is
		// not a button.
		expect(
			screen.queryByRole( 'button', { name: /Configure search visibility/ } )
		).not.toBeInTheDocument();
	} );

	it( 'calls onManage from the primary action button', () => {
		const onManage = jest.fn();
		render(
			<ContentCoverageCard data={ buildCoverage() } onManage={ onManage } onFilter={ jest.fn() } />
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn) for a single click.
		fireEvent.click( screen.getByRole( 'button', { name: 'Manage content SEO' } ) );

		expect( onManage ).toHaveBeenCalled();
	} );

	it( 'shows the empty state and no ring buttons when there is no content', () => {
		render(
			<ContentCoverageCard
				data={ buildCoverage( {
					total: 0,
					with_schema: 0,
					with_title: 0,
					with_description: 0,
					with_search_visible: 0,
				} ) }
				onManage={ jest.fn() }
				onFilter={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'No published posts or pages yet.' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Add schema to content/ } )
		).not.toBeInTheDocument();
	} );
} );
