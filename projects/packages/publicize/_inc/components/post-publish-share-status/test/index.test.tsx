jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useDispatch: jest.fn(),
		useSelect: jest.fn(),
	};

	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property as keyof typeof mocks ] ?? target[ property as keyof typeof target ];
		},
	} );
} );

import { render, screen } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import { useIsSharingPossible } from '../../../hooks/use-is-sharing-possible';
import { usePostMeta } from '../../../hooks/use-post-meta';
import { usePostPrePublishValue } from '../../../hooks/use-post-pre-publish-value';
import { usePostJustPublished } from '../../../hooks/use-saving-post';
import { PostPublishShareStatus } from '../index';

jest.mock( '../../../social-store', () => ( {
	store: 'jetpack-social',
} ) );

jest.mock( '@wordpress/editor', () => ( {
	store: 'core/editor',
	PluginPostPublishPanel: ( { children } ) => (
		<div data-testid="post-publish-panel">{ children }</div>
	),
} ) );

jest.mock( '../../../hooks/use-is-sharing-possible', () => ( {
	useIsSharingPossible: jest.fn(),
} ) );

jest.mock( '../../../hooks/use-post-meta', () => ( {
	usePostMeta: jest.fn(),
} ) );

jest.mock( '../../../hooks/use-post-pre-publish-value', () => ( {
	usePostPrePublishValue: jest.fn( value => value ),
} ) );

jest.mock( '../../../hooks/use-saving-post', () => ( {
	usePostJustPublished: jest.fn(),
} ) );

jest.mock( '../share-status', () => ( {
	ShareStatus: () => <div>Share status</div>,
} ) );

const mockUseDispatch = useDispatch as jest.Mock;
const mockUseSelect = useSelect as jest.Mock;

describe( 'PostPublishShareStatus', () => {
	const isPostPublished = true;
	let connectionsReadyToShare = [ { connection_id: '1' } ];

	beforeEach( () => {
		jest.clearAllMocks();

		mockUseDispatch.mockReturnValue( {
			pollForPostShareStatus: jest.fn(),
		} );

		mockUseSelect.mockImplementation( selector => {
			return selector( () => ( {
				isCurrentPostPublished: () => isPostPublished,
				getConnectionsReadyToShare: () => connectionsReadyToShare,
			} ) );
		} );

		( useIsSharingPossible as jest.Mock ).mockReturnValue( true );
		( usePostMeta as jest.Mock ).mockReturnValue( { isPublicizeEnabled: true } );
		( usePostPrePublishValue as jest.Mock ).mockImplementation( value => value );
		( usePostJustPublished as jest.Mock ).mockImplementation( () => {} );
	} );

	it( 'renders share status when a post is published and connections are ready to share', () => {
		render( <PostPublishShareStatus /> );

		expect( screen.getByTestId( 'post-publish-panel' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Share status' ) ).toBeInTheDocument();
	} );

	it( 'does not render when no connections are ready to share', () => {
		connectionsReadyToShare = [];

		render( <PostPublishShareStatus /> );

		expect( screen.queryByTestId( 'post-publish-panel' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Share status' ) ).not.toBeInTheDocument();
	} );
} );
