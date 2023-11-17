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
	const connectUrl = `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?page=my-jetpack#/connection`;
	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( connectUrl );

	if ( window?.Jetpack_Editor_Initial_State?.jetpack?.is_current_user_connected ) {
		return null;
	}

	const goToCheckoutPage = event => {
		autosaveAndRedirect( event );
	};

	return (
		<Nudge
			buttonText={ __( 'Reconnect Jetpack', 'jetpack' ) }
			checkoutUrl={ connectUrl }
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
