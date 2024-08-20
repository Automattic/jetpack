import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	getSiteFragment,
	isAtomicSite,
	isSimpleSite,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';
import { useAutoSaveAndRedirect } from './use-auto-save-and-redirect';

export const EnhancedFeaturesNudge: React.FC = () => {
	const hasPaidFeatures = useSelect( select => select( socialStore ).hasPaidFeatures(), [] );

	const autosaveAndRedirect = useAutoSaveAndRedirect();

	const isWpcom = isSimpleSite() || isAtomicSite();

	if ( isWpcom || hasPaidFeatures ) {
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
					'jetpack'
				) }
			</Button>
		</PanelRow>
	);
};
