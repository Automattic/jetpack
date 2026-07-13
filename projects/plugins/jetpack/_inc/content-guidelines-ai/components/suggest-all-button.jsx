import { JetpackLogo } from '@automattic/jetpack-components';
import { Button, Tooltip } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import useGenerateAll from '../hooks/use-generate-all';
import { AI_STORE_NAME } from '../store';

export default function SuggestAllButton() {
	const { generate, loading, hasFeature } = useGenerateAll();

	const bannerDismissed = useSelect( select => select( AI_STORE_NAME ).isBannerDismissed(), [] );

	// The plans store defaults hasFeature to true until its fetch resolves —
	// waiting for the real answer avoids the button flashing into the wrong
	// state (it briefly rendered as functional on no-plan sites).
	const featureResolved = useSelect(
		select => select( 'wordpress-com/plans' ).hasFinishedResolution( 'getAiAssistantFeature' ),
		[]
	);

	const allGuidelines = useSelect( select => {
		const store = select( STORE_NAME );
		return Object.fromEntries( VALID_SECTIONS.map( slug => [ slug, store.getGuideline( slug ) ] ) );
	}, [] );

	const allEmpty = VALID_SECTIONS.every( slug => ! allGuidelines[ slug ] );

	const generateLabel = __( 'Generate guidelines', 'jetpack' );
	const improveLabel = __( 'Improve guidelines', 'jetpack' );
	const label = allEmpty ? generateLabel : improveLabel;

	// Hide only while the empty-state banner is on screen — it carries its own
	// "Get started" CTA. Without an AI plan the button renders locked and
	// clicking it opens the upgrade notice (see useGenerateAll).
	const hidden = ! bannerDismissed && hasFeature;
	const hiddenProps = hidden ? { style: { display: 'none' }, 'aria-hidden': true } : {};

	if ( ! featureResolved ) {
		return null;
	}

	const button = (
		<Button
			{ ...hiddenProps }
			variant="primary"
			icon={ hasFeature ? <JetpackLogo showText={ false } height={ 18 } logoColor="#fff" /> : lock }
			onClick={ generate }
			disabled={ loading }
			accessibleWhenDisabled
			isBusy={ loading }
			className="jetpack-content-guidelines-ai__suggest-all-button"
		>
			{ label }
		</Button>
	);

	if ( ! hasFeature && ! hidden ) {
		return (
			<Tooltip text={ __( 'Upgrade to unlock the AI assistant', 'jetpack' ) }>{ button }</Tooltip>
		);
	}

	return button;
}
