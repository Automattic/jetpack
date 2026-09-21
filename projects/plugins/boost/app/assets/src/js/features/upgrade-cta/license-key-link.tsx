import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { detectMode } from '$lib/modern/mode';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { isWoaHosting } from '$lib/utils/hosting';
import {
	isAddLicenseAvailable,
	isMyJetpackAvailable,
} from '../../../../../../_inc/overview/lib/use-modules-state';

type LicenseKeyLinkProps = {
	className?: string;
};

export const licenseKeyHref = 'admin.php?page=my-jetpack#/add-license';

export function useCanRedeemLicenseKey(): boolean {
	const premiumFeatures = usePremiumFeatures();
	const hasPlan = premiumFeatures && premiumFeatures.length > 0;

	// Legacy keeps its own BoostAdminPage header button; modern moves redemption beside the prompts.
	return (
		detectMode() === 'modern' &&
		! isWoaHosting() &&
		! hasPlan &&
		isMyJetpackAvailable() &&
		isAddLicenseAvailable()
	);
}

export default function LicenseKeyLink( { className }: LicenseKeyLinkProps ) {
	if ( ! useCanRedeemLicenseKey() ) {
		return null;
	}

	const link = (
		<Button variant="link" href={ licenseKeyHref }>
			{ __( 'Use license key', 'jetpack-boost' ) }
		</Button>
	);

	return className ? <div className={ className }>{ link }</div> : link;
}
