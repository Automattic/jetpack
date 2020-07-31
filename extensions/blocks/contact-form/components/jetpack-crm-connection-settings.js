/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { get } from 'lodash';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ExternalLink, PanelRow, PanelBody, Spinner, ToggleControl } from '@wordpress/components';
import semver from 'semver';

/**
 * Internal dependencies
 */
import { jetpackCreateInterpolateElement } from '../../../shared/create-interpolate-element';

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
					<p className="jetpack-contact-form__crm_text">
						{ __(
							'The Zero BS CRM plugin is now Jetpack CRM. Update to the latest version to integrate your contact form with your CRM.',
							'jetpack'
						) }
					</p>
				);
			}

			if (
				pluginState.ACTIVE === jetpackCRMPlugin &&
				semver.satisfies( jetpackCRMVersion, '3.0.19 - 4.0.0' )
			) {
				return (
					<p className="jetpack-contact-form__crm_text">
						{ __(
							'Contacts from this form will be stored in Jetpack CRM if the CRM Jetpack Forms extension is active.',
							'jetpack'
						) }
					</p>
				);
			} else if (
				pluginState.ACTIVE === jetpackCRMPlugin &&
				semver.gt( jetpackCRMVersion, '4.0.0' )
			) {
				return null;
			} else if ( pluginState.INSTALLED === jetpackCRMPlugin ) {
				return (
					<p className="jetpack-contact-form__crm_text">
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
			<p className="jetpack-contact-form__crm_text">
				{ jetpackCreateInterpolateElement(
					__(
						'You can save contacts from Jetpack contact forms in Jetpack CRM. Learn more at <a>jetpackcrm.com</a>',
						'jetpack'
					),
					{
						a: <ExternalLink href="https://jetpackcrm.com" />,
					}
				) }
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
		<PanelBody title={ __( 'CRM Integration', 'jetpack' ) } initialOpen={ false }>
			<PanelRow>
				{ isFetchingPlugins && <Spinner /> }

				{ shouldDisplayToggle() && (
					<ToggleControl
						className="jetpack-contact-form__crm_toggle"
						label={ __( 'Jetpack CRM', 'jetpack' ) }
						checked={ jetpackCRM }
						onChange={ value => setAttributes( { jetpackCRM: value } ) }
						help={ __( 'Store in CRM', 'jetpack' ) }
					/>
				) }

				{ ! isFetchingPlugins && ! error && getText() }

				{ error && (
					<p>{ __( "Couldn't access the plugins. Please try again later.", 'jetpack' ) }</p>
				) }
			</PanelRow>
		</PanelBody>
	);
}

export default CRMConnectionSettings;
