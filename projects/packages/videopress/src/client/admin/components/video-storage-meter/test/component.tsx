import { render, screen } from '@testing-library/react';
import VideoStorageMeter from '../index';

describe( 'VideoStorageMeter', () => {
	const testProps = {
		total: 1024 * 1024 * 1024,
		used: ( 1024 * 1024 * 1024 ) / 4,
	};

	it( 'renders the used storage percentage', () => {
		render( <VideoStorageMeter { ...testProps } /> );
		expect( screen.getByText( '25% of 1 GiB of cloud video storage' ) ).toBeInTheDocument();
	} );
} );
