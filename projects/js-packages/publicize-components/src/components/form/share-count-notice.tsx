import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import { useShareLimits } from '../../hooks/use-share-limits';
import { store as socialStore } from '../../social-store';
import Notice from '../notice';
import { useAutoSaveAndRedirect } from './use-auto-save-and-redirect';

export const ShareCountNotice: React.FC = () => {
	const showShareLimits = useSelect( select => select( socialStore ).showShareLimits(), [] );

	const autosaveAndRedirect = useAutoSaveAndRedirect();
	const { message } = useShareLimits();

	if ( ! showShareLimits || ! message ) {
		return null;
	}

	return (
		<Notice
			type="warning"
			actions={ [
				<Button
					key="upgrade"
					variant="primary"
					onClick={ autosaveAndRedirect }
					href={ getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
						site: getSiteFragment(),
						query: 'redirect_to=' + encodeURIComponent( window.location.href ),
					} ) }
				>
					{ _x( 'Upgrade', 'Call to action to buy a new plan', 'jetpack' ) }
				</Button>,
			] }
		>
			{ message }
		</Notice>
	);
};
