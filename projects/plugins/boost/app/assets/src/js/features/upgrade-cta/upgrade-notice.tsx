import { lock } from '@wordpress/icons';
import { Notice } from '@wordpress/ui';
import { useModuleSurface } from '$features/module/surface';
import { canOfferUpgrade } from '../../../../../../_inc/overview/lib/use-modules-state';
import InterstitialModalCTA from './interstitial-modal-cta';
import ModernUpgradeLink from './modern-upgrade-link';

type UpgradeNoticeProps = {
	description: string;
	identifier: string;
};

export default function UpgradeNotice( { description, identifier }: UpgradeNoticeProps ) {
	if ( useModuleSurface() !== 'row' ) {
		return (
			<InterstitialModalCTA
				description={ description }
				identifier={ identifier }
				showLicenseKeyLink
			/>
		);
	}

	if ( ! canOfferUpgrade() ) {
		return null;
	}

	return (
		<Notice.Root intent="info" icon={ lock }>
			<Notice.Description>
				{ description }{ ' ' }
				<ModernUpgradeLink
					eventName="upsell_cta_from_settings_page_in_plugin"
					eventProperties={ { identifier } }
				/>
			</Notice.Description>
		</Notice.Root>
	);
}
