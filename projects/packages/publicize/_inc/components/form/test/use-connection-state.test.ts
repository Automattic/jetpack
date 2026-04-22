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

jest.mock( '@wordpress/date', () => ( {
	...jest.requireActual( '@wordpress/date' ),
	date: ( format: string, input?: string ) => {
		if ( format !== 'Y-m' ) {
			return '';
		}
		const source = input ? new Date( input ) : new Date();
		return `${ source.getUTCFullYear() }-${ String( source.getUTCMonth() + 1 ).padStart(
			2,
			'0'
		) }`;
	},
} ) );

jest.mock( '../../../utils/script-data', () => {
	const actual = jest.requireActual( '../../../utils/script-data' );
	return {
		...actual,
		hasSocialPaidFeatures: jest.fn(),
	};
} );

import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import useAttachedMedia from '../../../hooks/use-attached-media';
import useFeaturedImage from '../../../hooks/use-featured-image';
import useMediaDetails from '../../../hooks/use-media-details';
import useMediaRestrictions from '../../../hooks/use-media-restrictions';
import usePublicizeConfig from '../../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { hasSocialPaidFeatures } from '../../../utils/script-data';
import { useConnectionState } from '../use-connection-state';
import type { Connection } from '../../../social-store/types';

jest.mock( '../../../hooks/use-social-media-connections', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../../hooks/use-publicize-config', () => jest.fn() );
jest.mock( '../../../hooks/use-attached-media', () => jest.fn() );
jest.mock( '../../../hooks/use-featured-image', () => jest.fn() );
jest.mock( '../../../hooks/use-media-details', () => jest.fn() );
jest.mock( '../../../hooks/use-media-restrictions', () => jest.fn() );

const mockUseSelect = useSelect as jest.Mock;
const mockHasSocialPaidFeatures = hasSocialPaidFeatures as jest.Mock;

const mockXConnection: Connection = {
	connection_id: 'x-1',
	display_name: 'X Account',
	external_handle: '@x-user',
	external_id: 'x-external',
	profile_link: 'https://example.com/x',
	profile_picture: '',
	service_label: 'X',
	service_name: 'x',
	shared: false,
	status: 'ok',
	wpcom_user_id: 1,
	enabled: true,
};

const mockTumblrConnection: Connection = {
	connection_id: 'tumblr-1',
	display_name: 'Tumblr Account',
	external_handle: '@tumblr-user',
	external_id: 'tumblr-external',
	profile_link: 'https://example.com/tumblr',
	profile_picture: '',
	service_label: 'Tumblr',
	service_name: 'tumblr',
	shared: false,
	status: 'ok',
	wpcom_user_id: 1,
	enabled: true,
};

describe( 'useConnectionState', () => {
	// State controlled per-test.
	let xQuotaExceeded = false;
	let canScheduleForPost = true;
	let postDate: string | undefined;

	beforeEach( () => {
		jest.clearAllMocks();
		xQuotaExceeded = false;
		canScheduleForPost = true;
		postDate = undefined;
		mockHasSocialPaidFeatures.mockReturnValue( false );

		( useSocialMediaConnections as jest.Mock ).mockReturnValue( {
			connections: [ mockXConnection, mockTumblrConnection ],
		} );

		( usePublicizeConfig as jest.Mock ).mockReturnValue( {
			isPublicizeEnabled: true,
			isPublicizeDisabledBySitePlan: false,
		} );

		( useAttachedMedia as jest.Mock ).mockReturnValue( { attachedMedia: [] } );
		( useFeaturedImage as jest.Mock ).mockReturnValue( null );
		( useMediaDetails as jest.Mock ).mockReturnValue( [ null ] );
		( useMediaRestrictions as jest.Mock ).mockReturnValue( {
			validationErrors: {},
			isConvertible: true,
		} );

		mockUseSelect.mockImplementation( selector => {
			return selector( () => ( {
				// Social store
				isXQuotaExceeded: () => xQuotaExceeded,
				canShareToX: () => ! xQuotaExceeded,
				canScheduleXShareFor: () => canScheduleForPost,
				// Editor store
				getEditedPostAttribute: ( attr: string ) => ( attr === 'date' ? postDate : undefined ),
			} ) );
		} );
	} );

	describe( 'shouldBeDisabled / canBeTurnedOn', () => {
		it( 'blocks X connections when quota for the target period is exhausted', () => {
			xQuotaExceeded = true;
			canScheduleForPost = false;

			const { result } = renderHook( () => useConnectionState() );

			expect( result.current.shouldBeDisabled( mockXConnection ) ).toBe( true );
			expect( result.current.canBeTurnedOn( mockXConnection ) ).toBe( false );
			expect( result.current.getDisabledReason( mockXConnection ) ).toBe( 'quota_exceeded' );
		} );

		it( 'does not block non-X connections when X quota is exceeded', () => {
			xQuotaExceeded = true;
			canScheduleForPost = false;

			const { result } = renderHook( () => useConnectionState() );

			expect( result.current.shouldBeDisabled( mockTumblrConnection ) ).toBe( false );
			expect( result.current.canBeTurnedOn( mockTumblrConnection ) ).toBe( true );
			expect( result.current.getDisabledReason( mockTumblrConnection ) ).toBeUndefined();
		} );

		it( 'does not block X connections when the target period has quota', () => {
			xQuotaExceeded = false;
			canScheduleForPost = true;

			const { result } = renderHook( () => useConnectionState() );

			expect( result.current.shouldBeDisabled( mockXConnection ) ).toBe( false );
			expect( result.current.canBeTurnedOn( mockXConnection ) ).toBe( true );
			expect( result.current.getDisabledReason( mockXConnection ) ).toBeUndefined();
		} );

		it( 'does not block X when current month is exceeded but the post targets a future month with quota', () => {
			// Current month quota exhausted, but post is scheduled for a future month that still has quota.
			xQuotaExceeded = true;
			canScheduleForPost = true;
			postDate = '2099-12-01T00:00:00Z';
			mockHasSocialPaidFeatures.mockReturnValue( true );

			const { result } = renderHook( () => useConnectionState() );

			expect( result.current.shouldBeDisabled( mockXConnection ) ).toBe( false );
			expect( result.current.canBeTurnedOn( mockXConnection ) ).toBe( true );
		} );
	} );

	describe( 'getWarningReason', () => {
		it( 'returns the schedule hint when paid, current-month quota is exceeded, and no post date is set', () => {
			mockHasSocialPaidFeatures.mockReturnValue( true );
			xQuotaExceeded = true;
			canScheduleForPost = true;
			postDate = undefined;

			const { result } = renderHook( () => useConnectionState() );

			expect( result.current.getWarningReason( mockXConnection ) ).toBe(
				'quota_exceeded_schedule_hint'
			);
		} );

		it( 'returns undefined on free plans even when the quota is exhausted', () => {
			mockHasSocialPaidFeatures.mockReturnValue( false );
			xQuotaExceeded = true;
			canScheduleForPost = false;
			postDate = undefined;

			const { result } = renderHook( () => useConnectionState() );

			expect( result.current.getWarningReason( mockXConnection ) ).toBeUndefined();
		} );

		it( 'returns undefined when the post already has a scheduled date', () => {
			mockHasSocialPaidFeatures.mockReturnValue( true );
			xQuotaExceeded = true;
			canScheduleForPost = true;
			postDate = '2099-12-01T00:00:00Z';

			const { result } = renderHook( () => useConnectionState() );

			expect( result.current.getWarningReason( mockXConnection ) ).toBeUndefined();
		} );

		it( 'returns undefined for non-X connections', () => {
			mockHasSocialPaidFeatures.mockReturnValue( true );
			xQuotaExceeded = true;

			const { result } = renderHook( () => useConnectionState() );

			expect( result.current.getWarningReason( mockTumblrConnection ) ).toBeUndefined();
		} );
	} );
} );
