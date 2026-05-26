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
import usePublicizeConfig from '../../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { Description } from '../description';

jest.mock( '../../../hooks/use-publicize-config', () => jest.fn() );
jest.mock( '../../../hooks/use-social-media-connections', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockUseSelect = useSelect as jest.Mock;

describe( 'Description', () => {
	let isPostPublished = false;

	beforeEach( () => {
		jest.clearAllMocks();

		mockUseSelect.mockImplementation( selector => {
			return selector( () => ( {
				isCurrentPostPublished: () => isPostPublished,
			} ) );
		} );

		( usePublicizeConfig as jest.Mock ).mockReturnValue( {
			isPublicizeEnabled: true,
		} );

		( useSocialMediaConnections as jest.Mock ).mockReturnValue( {
			hasConnectionsReadyToShare: false,
		} );
	} );

	it( 'shows automatic-sharing copy only when there are connections ready to share', () => {
		( useSocialMediaConnections as jest.Mock ).mockReturnValue( {
			hasConnectionsReadyToShare: true,
		} );

		render( <Description /> );

		expect(
			screen.getByText( 'When the post is published, it will be shared automatically on:' )
		).toBeInTheDocument();
	} );

	it( 'shows fallback copy when there are no connections ready to share', () => {
		( useSocialMediaConnections as jest.Mock ).mockReturnValue( {
			hasConnectionsReadyToShare: false,
		} );

		render( <Description /> );

		expect(
			screen.getByText(
				'After the post is published, you can preview, and manually share or schedule it.'
			)
		).toBeInTheDocument();
	} );

	it( 'shows post-published instructions when the post is published', () => {
		isPostPublished = true;

		render( <Description /> );

		expect(
			screen.getByText(
				'Enable the social media accounts where you want to re-share your post, then click on the "Preview and Share" button below.'
			)
		).toBeInTheDocument();
	} );
} );
