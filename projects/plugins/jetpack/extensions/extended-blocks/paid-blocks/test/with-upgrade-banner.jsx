import { render, screen } from '@testing-library/react';
import withUpgradeBanner from '../with-upgrade-banner';

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
	getRequiredPlan: () => 'value_bundle',
	useAnalytics: () => ( { tracks: { recordEvent: jest.fn() } } ),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: () => ( {} ),
} ) );

jest.mock( '../upgrade-plan-banner', () => ( { visible, description } ) => (
	<div data-testid="banner" data-visible={ String( visible ) }>
		{ description }
	</div>
) );

const Edit = () => <div>edit</div>;
const EditWithBanner = withUpgradeBanner( Edit );

describe( 'withUpgradeBanner', () => {
	it.each( [
		[ 'a paid block', 'jetpack/paid-thing', {}, 'true' ],
		[
			'a core/video block with a video',
			'core/video',
			{ src: 'https://example.com/v.mp4' },
			'false',
		],
		[ 'an empty core/video block', 'core/video', {}, 'true' ],
		[ 'a core/audio block', 'core/audio', {}, 'false' ],
	] )( 'banner visibility on %s', ( _label, name, attributes, visible ) => {
		render(
			<EditWithBanner
				name={ name }
				clientId="client-id"
				isSelected
				attributes={ attributes }
				setAttributes={ jest.fn() }
			/>
		);

		expect( screen.getByTestId( 'banner' ) ).toHaveAttribute( 'data-visible', visible );
	} );
} );
