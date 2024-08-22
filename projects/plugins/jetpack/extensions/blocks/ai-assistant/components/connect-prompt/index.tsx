/*
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/*
 * Internal dependencies
 */
import { Nudge } from '../../../../shared/components/upgrade-nudge';
import useAutosaveAndRedirect from '../../../../shared/use-autosave-and-redirect';

const ConnectPrompt = () => {
	const checkoutUrl = `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?page=my-jetpack#/connection`;
	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( checkoutUrl );

	const goToCheckoutPage = event => {
		autosaveAndRedirect( event );
	};

	return (
		<Nudge
			buttonText={ __( 'Connect Jetpack', 'jetpack' ) }
			checkoutUrl={ checkoutUrl }
			className={ 'jetpack-ai-connect-banner' }
			description={ __( 'Your account is not connected to Jetpack at the moment.', 'jetpack' ) }
			goToCheckoutPage={ goToCheckoutPage }
			isRedirecting={ isRedirecting }
			visible={ true }
			align={ null }
			title={ null }
			context={ null }
		/>
	);
};

export default ConnectPrompt;
