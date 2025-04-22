import restApi from '@automattic/jetpack-api';
import { __ } from '@wordpress/i18n';
import { getMyJetpackWindowRestState } from './get-my-jetpack-window-state';

const resetJetpackOptions = async () => {
	const { apiRoot, apiNonce } = getMyJetpackWindowRestState();
	restApi.setApiRoot( apiRoot );
	restApi.setApiNonce( apiNonce );

	if (
		// eslint-disable-next-line no-alert
		window.confirm(
			__( 'This will reset all Jetpack options, are you sure?', 'jetpack-my-jetpack' )
		)
	) {
		try {
			const res = await restApi.resetOptions( 'options' );

			if ( res.code === 'success' ) {
				// eslint-disable-next-line no-alert
				window.alert(
					__( 'Options reset! Have fun messing them up again :-)', 'jetpack-my-jetpack' )
				);
			}
		} catch {
			// eslint-disable-next-line no-alert
			window.alert( __( 'Options failed to reset.', 'jetpack-my-jetpack' ) );
		}
	}
};

export default resetJetpackOptions;
