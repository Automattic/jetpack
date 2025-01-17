import { getRedirectUrl } from '@automattic/jetpack-components';
import { AdminSiteData, getScriptData } from '@automattic/jetpack-script-data';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelRow } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { hasSocialPaidFeatures } from '../../utils';
import styles from './styles.module.scss';
import { useAutoSaveAndRedirect } from './use-auto-save-and-redirect';

const DISABLE_NUDGE_FOR: Array< AdminSiteData[ 'host' ] > = [ 'wpcom', 'atomic', 'woa', 'vip' ];

export const EnhancedFeaturesNudge: React.FC = () => {
	const autosaveAndRedirect = useAutoSaveAndRedirect();

	if ( hasSocialPaidFeatures() || DISABLE_NUDGE_FOR.includes( getScriptData().site.host ) ) {
		return null;
	}

	return (
		<PanelRow className={ styles[ 'enhanced-features-nudge' ] }>
			<Button
				key="upgrade"
				variant="link"
				onClick={ autosaveAndRedirect }
				href={ getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
					site: getSiteFragment() || '',
					query: 'redirect_to=' + encodeURIComponent( window.location.href ),
				} ) }
			>
				{ _x(
					'Unlock enhanced media sharing features.',
					'Call to action to buy a new plan',
					'jetpack-publicize-components'
				) }
			</Button>
		</PanelRow>
	);
};
