import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { detectMode } from '$lib/modern/mode';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { isWoaHosting } from '$lib/utils/hosting';

type LicenseKeyLinkProps = {
	className?: string;
};

export default function LicenseKeyLink( { className }: LicenseKeyLinkProps ) {
	const premiumFeatures = usePremiumFeatures();
	const hasPlan = premiumFeatures && premiumFeatures.length > 0;

	if ( detectMode() !== 'modern' || isWoaHosting() || hasPlan ) {
		return null;
	}

	const link = (
		<Button variant="link" href="admin.php?page=my-jetpack#/add-license">
			{ __( 'Use license key', 'jetpack-boost' ) }
		</Button>
	);

	return className ? <div className={ className }>{ link }</div> : link;
}
