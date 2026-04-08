import { JetpackLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import useGenerateAll from '../hooks/use-generate-all';

const DISMISS_KEY = 'jetpack_content_guidelines_banner_dismissed';

export default function SuggestAllButton() {
	const { generate, loading } = useGenerateAll();

	// Track banner dismissed state — re-read when loading changes
	// (banner sets this to '1' when "Get started" is clicked).
	const [ bannerDismissed, setBannerDismissed ] = useState(
		() => localStorage.getItem( DISMISS_KEY ) === '1'
	);

	// Re-check localStorage when loading state changes (banner may have just dismissed).
	if ( ! bannerDismissed && localStorage.getItem( DISMISS_KEY ) === '1' ) {
		setBannerDismissed( true );
	}

	const allGuidelines = useSelect( select => {
		const store = select( STORE_NAME );
		return Object.fromEntries( VALID_SECTIONS.map( slug => [ slug, store.getGuideline( slug ) ] ) );
	}, [] );

	const allEmpty = VALID_SECTIONS.every( slug => ! allGuidelines[ slug ] );

	const generateLabel = __( 'Generate guidelines', 'jetpack' );
	const improveLabel = __( 'Improve guidelines', 'jetpack' );
	const label = allEmpty ? generateLabel : improveLabel;

	// Hide when the banner is still showing (all empty + not dismissed).
	const showBanner = allEmpty && ! bannerDismissed;
	const hiddenProps = showBanner ? { style: { display: 'none' }, 'aria-hidden': true } : {};

	return (
		<Button
			{ ...hiddenProps }
			variant="primary"
			icon={ <JetpackLogo size={ 8 } /> }
			onClick={ generate }
			disabled={ loading }
			accessibleWhenDisabled
			isBusy={ loading }
			className="jetpack-content-guidelines-ai__suggest-all-button"
		>
			{ label }
		</Button>
	);
}
