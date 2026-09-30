import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import './admin.scss';

const MailchimpSettings = ( { isConnected } ) => {
	const [ audiences, setAudiences ] = useState( [ { id: 'none', name: __( 'None', 'jetpack' ) } ] );
	const [ selectedAudience, setSelectedAudience ] = useState( 'none' );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ saveStatus, setSaveStatus ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );

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

	// Save right away so the block works without submitting the form; "None" still waits for Save Changes.
	// One save at a time, or responses landing out of order could store an earlier pick.
	const onChange = e => {
		const audience = e.target.value;
		setSelectedAudience( audience );
		if ( audience === 'none' ) {
			setSaveStatus( '' );
			return;
		}
		setIsSaving( true );
		setSaveStatus( __( 'Saving…', 'jetpack' ) );
		apiFetch( {
			path: '/wpcom/v2/mailchimp/settings',
			method: 'POST',
			data: { follower_list_id: audience },
		} )
			.then( () => setSaveStatus( __( 'Saved.', 'jetpack' ) ) )
			.catch( error => setSaveStatus( error?.message || __( 'Settings save failed.', 'jetpack' ) ) )
			.finally( () => setIsSaving( false ) );
	};

	return (
		<div className="jetpack-mailchimp-settings">
			<label htmlFor="jetpack-mailchimp-audience">
				{ __( 'Audience that your visitors can subscribe to:', 'jetpack' ) }
				<select
					id="jetpack-mailchimp-audience"
					name="jetpack-mailchimp-audience"
					onChange={ onChange }
					value={ selectedAudience }
					disabled={ isLoading || isSaving }
				>
					{ audiences.map( audience => (
						<option key={ audience.id } value={ audience.id }>
							{ audience.name }
						</option>
					) ) }
				</select>
			</label>
			<p className="description" role="status">
				{ saveStatus }
			</p>
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
