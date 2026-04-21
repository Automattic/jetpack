jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useSelect: jest.fn(),
	};

	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property as keyof typeof mocks ] ?? target[ property as keyof typeof target ];
		},
	} );
} );

import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import useSocialMediaConnections from '../../../../hooks/use-social-media-connections';
import { FooterContent } from '../footer-content';

jest.mock( '../../../../social-store', () => ( {
	store: 'jetpack-social',
} ) );

jest.mock( '@wordpress/editor', () => ( {
	store: 'core/editor',
} ) );

jest.mock( '../../../../hooks/use-social-media-connections', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../confirmation-config', () => ( {
	ConfirmationConfig: () => <div>Confirmation config</div>,
} ) );

const mockUseSelect = useSelect as jest.Mock;

describe( 'FooterContent', () => {
	const isCurrentPostPublished = false;
	const isPublishSidebarOpened = false;

	beforeEach( () => {
		jest.clearAllMocks();

		mockUseSelect.mockImplementation( selector => {
			return selector( () => ( {
				isCurrentPostPublished: () => isCurrentPostPublished,
				isPublishSidebarOpened: () => isPublishSidebarOpened,
			} ) );
		} );
	} );

	it( 'shows ready-to-share account count based on connectionsReadyToShare', () => {
		( useSocialMediaConnections as jest.Mock ).mockReturnValue( {
			connectionsReadyToShare: [ { connection_id: '1' }, { connection_id: '2' } ],
		} );

		render( <FooterContent /> );

		expect( screen.getByText( 'Ready to share to 2 accounts.' ) ).toBeInTheDocument();
	} );

	it( 'does not show ready-to-share copy when no connections are ready', () => {
		( useSocialMediaConnections as jest.Mock ).mockReturnValue( {
			connectionsReadyToShare: [],
		} );

		render( <FooterContent /> );

		expect( screen.queryByText( /Ready to share to/i ) ).not.toBeInTheDocument();
	} );
} );
