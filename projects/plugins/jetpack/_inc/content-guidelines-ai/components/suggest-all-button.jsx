import { JetpackLogo } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import useGenerateAll from '../hooks/use-generate-all';
import { AI_STORE_NAME } from '../store';

export default function SuggestAllButton() {
	const { generate, loading, hasFeature } = useGenerateAll();

	const bannerDismissed = useSelect( select => select( AI_STORE_NAME ).isBannerDismissed(), [] );

	const allGuidelines = useSelect( select => {
		const store = select( STORE_NAME );
		return Object.fromEntries( VALID_SECTIONS.map( slug => [ slug, store.getGuideline( slug ) ] ) );
	}, [] );

	const allEmpty = VALID_SECTIONS.every( slug => ! allGuidelines[ slug ] );

	const generateLabel = __( 'Generate guidelines', 'jetpack' );
	const improveLabel = __( 'Improve guidelines', 'jetpack' );
	const label = allEmpty ? generateLabel : improveLabel;

	// Hide when the banner is visible (not yet dismissed) or user lacks AI plan.
	const hidden = ! bannerDismissed || ! hasFeature;
	const hiddenProps = hidden ? { style: { display: 'none' }, 'aria-hidden': true } : {};

	return (
		<Button
			{ ...hiddenProps }
			variant="primary"
			icon={ <JetpackLogo showText={ false } height={ 18 } logoColor="#fff" /> }
			onClick={ generate }
			disabled={ loading || ! hasFeature }
			accessibleWhenDisabled
			isBusy={ loading }
			className="jetpack-content-guidelines-ai__suggest-all-button"
		>
			{ label }
		</Button>
	);
}
