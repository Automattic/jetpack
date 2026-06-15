import { getUserConnectionUrl } from '@automattic/jetpack-connection';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

export const onError = ( message, registry ) =>
	registry.dispatch( noticesStore ).createErrorNotice( message, { type: 'snackbar' } );

export const onSuccess = ( message, registry ) =>
	registry.dispatch( noticesStore ).createSuccessNotice( message, { type: 'snackbar' } );

export const handleResolverError = ( error, registry ) => {
	if ( error?.code === 'rest_unauthorized' && ! isSimpleSite() ) {
		const connectUrl = getUserConnectionUrl( { from: 'editor' } );
		registry
			.dispatch( noticesStore )
			.createNotice(
				'warning',
				__(
					'To use publishing features like subscriptions and paid memberships, connect your WordPress.com account.',
					'jetpack'
				),
				{
					id: 'jetpack-memberships-user-connection-required',
					actions: [
						{
							label: __( 'Connect account', 'jetpack' ),
							url: connectUrl,
						},
					],
				}
			);
	} else {
		onError( error.message, registry );
	}
};
