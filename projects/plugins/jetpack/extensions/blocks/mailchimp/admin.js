import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import './admin.scss';

const MailchimpSettings = ( { isConnected } ) => {
	const [ audiences, setAudiences ] = useState( [ { id: 'none', name: __( 'None', 'jetpack' ) } ] );
	const [ selectedAudience, setSelectedAudience ] = useState( 'none' );
	const [ isLoading, setIsLoading ] = useState( false );

	useEffect( () => {
		if ( ! isConnected ) {
			return;
		}
		setIsLoading( true );
		apiFetch( { path: '/wpcom/v2/mailchimp/settings', method: 'GET' } ).then( response => {
			if ( ! response.audiences ) {
				return;
			}

			setAudiences( [ { id: 'none', name: __( 'None', 'jetpack' ) }, ...response.audiences ] );
			if (
				response.follower_list_id &&
				response.audiences.find( ( { id } ) => id === response.follower_list_id )
			) {
				setSelectedAudience( response.follower_list_id );
			}

			setIsLoading( false );
		} );
		// Don't include audiences in the dependency array to avoid loop.
	}, [ isConnected ] );

	if ( ! isConnected ) {
		return null;
	}

	return (
		<div className="jetpack-mailchimp-settings">
			<label htmlFor="jetpack-mailchimp-audience">
				{ __( 'Audience that your visitors can subscribe to:', 'jetpack' ) }
				<select
					id="jetpack-mailchimp-audience"
					name="jetpack-mailchimp-audience"
					onChange={ e => setSelectedAudience( e.target.value ) }
					value={ selectedAudience }
					disabled={ isLoading }
				>
					{ audiences.map( audience => (
						<option key={ audience.id } value={ audience.id }>
							{ audience.name }
						</option>
					) ) }
				</select>
			</label>
		</div>
	);
};

addFilter(
	'jetpack.externalConnections.extraSettings',
	'jetpack/mailchimp/admin',
	( extraSettings, service ) => {
		if ( service !== 'mailchimp' ) {
			return extraSettings;
		}
		return MailchimpSettings;
	}
);
