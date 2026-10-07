/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { video as videoIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { ReportThumbnail } from '../report-thumbnail';

const renderThumbnail = ( thumbnailUrl?: string ) => (
	<ReportThumbnail thumbnailUrl={ thumbnailUrl } fallbackIcon={ videoIcon } />
);

describe( 'ReportThumbnail', () => {
	it( 'renders the fallback icon without a thumbnail', () => {
		render( renderThumbnail() );

		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'report-thumbnail-placeholder' ) ).toBeInTheDocument();
	} );

	it( 'falls back after a load failure and retries when the URL changes', () => {
		const { rerender } = render( renderThumbnail( 'https://example.com/a.jpg' ) );

		fireEvent.error( screen.getByRole( 'presentation' ) );
		expect( screen.getByTestId( 'report-thumbnail-placeholder' ) ).toBeInTheDocument();

		rerender( renderThumbnail( 'https://example.com/b.jpg' ) );
		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://example.com/b.jpg'
		);
	} );
} );
