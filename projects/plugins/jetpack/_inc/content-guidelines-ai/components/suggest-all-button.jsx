import { JetpackLogo } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { Tooltip } from '@wordpress/ui';
import { useAllSectionsEmpty } from '../hooks/use-drafts';
import useGenerateAll from '../hooks/use-generate-all';
import { AI_STORE_NAME } from '../store';

export default function SuggestAllButton() {
	const { generate, loading, hasFeature } = useGenerateAll();

	const bannerDismissed = useSelect( select => select( AI_STORE_NAME ).isBannerDismissed(), [] );

	const allEmpty = useAllSectionsEmpty();

	const generateLabel = __( 'Generate guidelines', 'jetpack' );
	const improveLabel = __( 'Improve guidelines', 'jetpack' );
	const label = allEmpty ? generateLabel : improveLabel;

	// Hide only while the welcome banner is on screen — it carries its own
	// "Get started" CTA. Without an AI plan the button renders locked and
	// clicking it opens the upgrade notice (see useGenerateAll).
	const hidden = ! bannerDismissed && hasFeature;
	const hiddenProps = hidden ? { style: { display: 'none' }, 'aria-hidden': true } : {};

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
			<Tooltip.Root>
				<Tooltip.Trigger render={ button } />
				<Tooltip.Popup>{ __( 'Upgrade to unlock the AI assistant', 'jetpack' ) }</Tooltip.Popup>
			</Tooltip.Root>
		);
	}

	return button;
}
