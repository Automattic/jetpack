import { render, screen } from '@testing-library/react';
import { useOnboardingCounts } from '../../../hooks/use-onboarding-counts';
import OnboardingModal from '../index';

/*
 * The `wp-theme` bundled with core 7.0.x exposes only `privateApis`, so the
 * modal's public `ThemeProvider` import resolves to undefined there. The real
 * `privateApis` is kept because `@wordpress/ui` unlocks its provider from it —
 * exactly the environment where the unguarded import blanked the dashboard.
 */
jest.mock( '@wordpress/theme', () => {
	const { privateApis } = jest.requireActual( '@wordpress/theme' );
	return { __esModule: true, privateApis };
} );

jest.mock( '../../../hooks/use-onboarding-counts', () => ( {
	useOnboardingCounts: jest.fn(),
} ) );

jest.mock( '../../../hooks/use-upload', () => ( {
	useUpload: () => ( { uploadQueue: [] } ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
	useSearch: () => ( {} ),
} ) );

jest.mock( '../intro-video', () => ( {
	__esModule: true,
	default: () => null,
	INTRO_VIDEO_ASPECT: '16 / 9',
	getAssetUrl: () => undefined,
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { wpcom: { blog_id: 123 } },
		user: { current_user: { id: 7 } },
	} ),
	isWoASite: jest.fn( () => false ),
	isSimpleSite: jest.fn( () => false ),
} ) );

describe( 'OnboardingModal without a public ThemeProvider', () => {
	beforeEach( () => {
		window.localStorage.clear();
		window.history.replaceState( {}, '', '/wp-admin/admin.php?page=jetpack-videopress' );
	} );

	it( 'still renders the modal and its close affordance', () => {
		( useOnboardingCounts as jest.Mock ).mockReturnValue( {
			videoPressCount: 0,
			localCount: 0,
			isSettled: true,
		} );

		render( <OnboardingModal /> );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Close' } ) ).toBeInTheDocument();
	} );
} );
