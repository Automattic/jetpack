import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import BlogStatsEdit from '../edit';

jest.mock( '@wordpress/api-fetch' );

jest.mock( '@automattic/jetpack-shared-extension-utils' );

jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn() );
useSelect.mockImplementation( () => {
	return {
		getCurrentPostId: jest.fn().mockReturnValueOnce( '100' ),
	};
} );

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: jest.fn(),
} ) );

const defaultAttributes = {
	label: '',
	statsOption: 'site',
};

const defaultProps = {
	attributes: defaultAttributes,
	setAttributes: jest.fn(),
};

beforeEach( () => {
	apiFetch.mockReturnValue(
		Promise.resolve( {
			'post-views': null,
			'blog-views': null,
		} )
	);

	useModuleStatus.mockReturnValue( {
		isModuleActive: true,
		changeStatus: jest.fn(),
	} );
} );

describe( 'Blog Stats', () => {
	test( 'loads stats', async () => {
		render( <BlogStatsEdit { ...defaultProps } /> );

		await waitFor( () => {
			expect( screen.getByText( 'Loading stats…' ) ).toBeInTheDocument();
		} );
	} );

	test( 'renders option to activate stats when module is disabled', async () => {
		useModuleStatus.mockReturnValue( {
			isModuleActive: false,
			changeStatus: jest.fn(),
		} );

		render( <BlogStatsEdit { ...defaultProps } /> );

		await waitFor( () => {
			expect( screen.getByText( 'Activate Stats' ) ).toBeInTheDocument();
		} );
	} );
} );
