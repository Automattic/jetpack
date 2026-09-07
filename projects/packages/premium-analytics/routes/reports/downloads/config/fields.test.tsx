/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getDownloadsFields } from './fields';
import type { StatsFileDownloadsComparisonItem } from '@jetpack-premium-analytics/data';

const download: StatsFileDownloadsComparisonItem = {
	label: '/files/report.pdf',
	shortLabel: 'report.pdf',
	link: 'https://example.com/files/report.pdf',
	downloads: 1234,
	previousDownloads: 1000,
	linkTitle: '/files/report.pdf',
	labelIcon: 'external',
	children: null,
};

/**
 * Render one table field for a file-download row.
 *
 * @param id             - Field identifier.
 * @param item           - File-download row.
 * @param withComparison - Whether comparison deltas are enabled.
 * @return The Testing Library render result.
 */
function renderField( id: string, item: StatsFileDownloadsComparisonItem, withComparison = false ) {
	const field = getDownloadsFields( withComparison ).find( candidate => candidate.id === id );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field component.
	const FieldComponent = field?.render;

	if ( ! field || ! FieldComponent ) {
		throw new Error( `Downloads field ${ id } is unavailable` );
	}

	return render( <FieldComponent item={ item } field={ field as never } /> );
}

describe( 'downloads fields', () => {
	it( 'renders the filename as an external asset link', () => {
		renderField( 'file', download );

		const link = screen.getByRole( 'link', { name: 'report.pdf' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/files/report.pdf' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'renders the filename as plain text when the asset URL is unsafe', () => {
		renderField( 'file', { ...download, link: 'javascript:alert(1)' } );

		expect( screen.getByText( 'report.pdf' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'marks the file field searchable and formats the download count', () => {
		const fileField = getDownloadsFields().find( field => field.id === 'file' );
		expect( fileField?.enableGlobalSearch ).toBe( true );

		renderField( 'downloads', download );
		expect(
			screen.getByText( content => content.replace( /\D/g, '' ) === '1234' )
		).toBeInTheDocument();
		expect( screen.queryByText( /%/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders the download delta when comparison is enabled', () => {
		renderField( 'downloads', download, true );

		expect( screen.getByText( '+23%' ) ).toBeInTheDocument();
	} );
} );
