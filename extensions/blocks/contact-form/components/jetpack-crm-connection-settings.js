/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { get } from 'lodash';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BaseControl, ExternalLink, Spinner, ToggleControl } from '@wordpress/components';
import semver from 'semver';

function CRMConnectionSettings( props ) {
	const pluginState = Object.freeze( {
		ACTIVE: 1,
		INSTALLED: 2,
		NOT_INSTALLED: 3,
	} );

	const { jetpackCRM, setAttributes } = props;

	const [ isFetchingPlugins, setIsFetchingPlugins ] = useState( false );
	const [ plugins, setPlugins ] = useState( null );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		setIsFetchingPlugins( true );

		apiFetch( {
			path: '/jetpack/v4/plugins',
		} )
			.then( result => {
				if ( result.error ) {
					throw result.message;
				}

				setPlugins( result );
			} )
			.catch( () => setError( true ) )
			.finally( () => setIsFetchingPlugins( false ) );
	}, [] );

	let jetpackCRMPlugin = pluginState.NOT_INSTALLED;
	let jetpackCRMVersion = null;

	if ( get( plugins, [ 'zero-bs-crm/ZeroBSCRM.php' ] ) ) {
		jetpackCRMVersion = semver.coerce( get( plugins, [ 'zero-bs-crm/ZeroBSCRM.php', 'Version' ] ) );

		if ( get( plugins, [ 'zero-bs-crm/ZeroBSCRM.php', 'active' ] ) ) {
			jetpackCRMPlugin = pluginState.ACTIVE;
		} else {
			jetpackCRMPlugin = pluginState.INSTALLED;
		}
	}

	const getText = () => {
		if ( jetpackCRMVersion ) {
			if ( semver.lt( jetpackCRMVersion, '3.0.19' ) ) {
				return (
					<p>
						{ __(
							'The Zero BS CRM plugin is now Jetpack CRM. Update to the latest version to integrate your contact form with your CRM.',
							'jetpack'
						) }
					</p>
				);
			}

			if ( pluginState.ACTIVE === jetpackCRMPlugin ) {
				return (
					<div>
						<p>
							{ __(
								'You can save contacts from this contact form in your Jetpack CRM.',
								'jetpack'
							) }
						</p>
						<p>
							{ __(
								'Make sure the Jetpack Contact Form Extension is enabled in Jetpack CRM.',
								'jetpack'
							) }
						</p>
					</div>
				);
			} else if ( pluginState.INSTALLED === jetpackCRMPlugin ) {
				return (
					<p>
						{ __(
							'Activate Jetpack CRM to save contacts from this contact form in your Jetpack CRM.',
							'jetpack'
						) }
					</p>
				);
			}
		}

		// Either no valid version or Jetpack CRM is not installed.
		return (
			<p>
				{ __(
					'You can save contacts from Jetpack contact forms in Jetpack CRM. Learn more at ',
					'jetpack'
				) }
				<ExternalLink href="https://jetpackcrm.com">jetpackcrm.com</ExternalLink>
			</p>
		);
	};

	const shouldDisplayToggle = () => {
		if ( pluginState.ACTIVE !== jetpackCRMPlugin || ! jetpackCRMVersion ) {
			return false;
		}

		return semver.gt( jetpackCRMVersion, '4.0.0' );
	};

	return (
		<BaseControl>
			{ isFetchingPlugins && <Spinner /> }

			{ shouldDisplayToggle() && (
				<ToggleControl
					label={ __( 'CRM Connection', 'jetpack' ) }
					checked={ jetpackCRM }
					onChange={ value => setAttributes( { jetpackCRM: value } ) }
					help={ __( 'Enable and disable Jetpack CRM integration for this form.', 'jetpack' ) }
				/>
			) }

			{ ! isFetchingPlugins && ! error && getText() }

			{ error && (
				<p>{ __( "Couldn't access the plugins. Please try again later.", 'jetpack' ) }</p>
			) }
		</BaseControl>
	);
}

export default CRMConnectionSettings;
