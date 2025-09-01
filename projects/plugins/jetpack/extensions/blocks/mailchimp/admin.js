/* global jetpackExternalConnectionsData */

import { useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import './admin.scss';

const MailchimpSettings = ( { isConnected } ) => {
	const config = jetpackExternalConnectionsData.mailchimp;

	const [ selectedAudience, setSelectedAudience ] = useState(
		config.settings?.follower_list_id ?? 'none'
	);

	if ( ! isConnected ) {
		return null;
	}

	const audiences = [ { id: 'none', name: __( 'None', 'jetpack' ) }, ...config.audiences ];

	return (
		<div className="jetpack-mailchimp-settings">
			<label htmlFor="jetpack-mailchimp-audience">
				{ __( 'Audience that your visitors can subscribe to:', 'jetpack' ) }
				<select
					id="jetpack-mailchimp-audience"
					name="jetpack-mailchimp-audience"
					onChange={ e => setSelectedAudience( e.target.value ) }
					value={ selectedAudience }
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
