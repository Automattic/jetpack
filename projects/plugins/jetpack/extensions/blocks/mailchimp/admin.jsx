import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import './admin.scss';

const MailchimpSettings = ( { isConnected } ) => {
	const [ audiences, setAudiences ] = useState( [ { id: 'none', name: __( 'None', 'jetpack' ) } ] );
	const [ selectedAudience, setSelectedAudience ] = useState( 'none' );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ saveError, setSaveError ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isSaved, setIsSaved ] = useState( false );

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

	// Save right away so the block works without submitting the form.
	// One save at a time, or responses landing out of order could store an earlier pick.
	const onChange = e => {
		const audience = e.target.value;
		const previousAudience = selectedAudience;
		setSelectedAudience( audience );
		setIsSaving( true );
		setIsSaved( false );
		setSaveError( '' );
		apiFetch( {
			path: '/wpcom/v2/mailchimp/settings',
			method: 'POST',
			data: { follower_list_id: audience },
		} )
			.then( () => setIsSaved( true ) )
			.catch( error => {
				const message = error?.message || __( 'Settings save failed.', 'jetpack' );
				setSelectedAudience( previousAudience );
				setSaveError( message );
				speak( message, 'assertive' );
			} )
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
			{ /* Same status as the Media Library's self-saving fields: spinner, then "Saved.". */ }
			<span role="status" style={ { marginInlineStart: '8px' } }>
				{ isSaving && (
					<span className="spinner is-active" style={ { float: 'none', margin: 0 } } />
				) }
				{ isSaved && __( 'Saved.', 'jetpack' ) }
			</span>
			{ /* A disabled select is left out of the form, so Save Changes mid-save would drop the pick. */ }
			{ isSaving && (
				<input type="hidden" name="jetpack-mailchimp-audience" value={ selectedAudience } />
			) }
			{ saveError && (
				<div className="notice notice-error inline">
					<p>{ saveError }</p>
				</div>
			) }
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
