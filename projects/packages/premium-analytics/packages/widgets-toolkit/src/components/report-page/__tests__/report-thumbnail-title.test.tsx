/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { video as videoIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { ReportThumbnailTitle } from '../report-thumbnail-title';

const renderTitle = ( thumbnailUrl?: string ) => (
	<ReportThumbnailTitle thumbnailUrl={ thumbnailUrl } fallbackIcon={ videoIcon }>
		{ classNames => <span className={ classNames.text }>Launch video</span> }
	</ReportThumbnailTitle>
);

describe( 'ReportThumbnailTitle', () => {
	it( 'renders the thumbnail beside the title', () => {
		render( renderTitle( 'https://example.com/a.jpg' ) );

		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://example.com/a.jpg'
		);
		expect( screen.getByText( 'Launch video' ) ).toBeInTheDocument();
	} );

	it( 'renders the fallback icon without a thumbnail', () => {
		render( renderTitle() );

		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'report-thumbnail-placeholder' ) ).toBeInTheDocument();
	} );

	it( 'falls back after a load failure and retries when the URL changes', () => {
		const { rerender } = render( renderTitle( 'https://example.com/a.jpg' ) );

		fireEvent.error( screen.getByRole( 'presentation' ) );
		expect( screen.getByTestId( 'report-thumbnail-placeholder' ) ).toBeInTheDocument();

		rerender( renderTitle( 'https://example.com/b.jpg' ) );
		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://example.com/b.jpg'
		);
	} );
} );
