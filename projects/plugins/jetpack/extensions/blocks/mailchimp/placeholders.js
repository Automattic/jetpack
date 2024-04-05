import { Button, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BLOCK_CLASS } from './constants';

export const UserConnectedPlaceholder = ( { icon, notices, connectURL, apiCall } ) => (
	<Placeholder
		className={ BLOCK_CLASS }
		icon={ icon }
		label={ __( 'Mailchimp', 'jetpack' ) }
		notices={ notices }
		instructions={ __(
			'You need to connect your Mailchimp account and choose an audience in order to start collecting Email subscribers.',
			'jetpack'
		) }
	>
		<Button variant="secondary" href={ connectURL } target="_blank">
			{ __( 'Set up Mailchimp form', 'jetpack' ) }
		</Button>
		<div className={ `${ BLOCK_CLASS }-recheck` }>
			<Button variant="link" onClick={ apiCall }>
				{ __( 'Re-check Connection', 'jetpack' ) }
			</Button>
		</div>
	</Placeholder>
);

export const UserNotConnectedPlaceholder = ( { icon, notices, connectURL } ) => (
	<Placeholder
		className={ BLOCK_CLASS }
		icon={ icon }
		label={ __( 'Mailchimp', 'jetpack' ) }
		notices={ notices }
		instructions={ __( "First, you'll need to connect your WordPress.com account.", 'jetpack' ) }
	>
		<Button variant="secondary" href={ connectURL }>
			{ __( 'Connect to WordPress.com', 'jetpack' ) }
		</Button>
	</Placeholder>
);
