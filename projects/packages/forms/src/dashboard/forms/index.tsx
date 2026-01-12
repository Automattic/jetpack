/**
 * External dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../hooks/use-config-value.ts';
import FormsResponsesTabs from '../components/forms-responses-tabs/index.tsx';
import Page from '../components/page/index.tsx';

/**
 * Forms dashboard "Forms" route placeholder.
 *
 * @return {JSX.Element|null} The placeholder page, or null when redirecting.
 */
export default function FormsDashboardForms(): JSX.Element | null {
	const navigate = useNavigate();
	const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );

	useEffect( () => {
		if ( isCentralFormManagementEnabled === false ) {
			navigate( '/responses', { replace: true } );
		}
	}, [ isCentralFormManagementEnabled, navigate ] );

	// Avoid rendering the placeholder if the flag is off (we'll redirect).
	if ( isCentralFormManagementEnabled === false ) {
		return null;
	}

	return (
		<div className="jp-forms-layout__surface is-stage">
			<Page
				title={
					<div className="jp-forms-page-header-title">
						<JetpackLogo showText={ false } width={ 20 } />
						{ __( 'Forms', 'jetpack-forms' ) }
					</div>
				}
				subTitle={ __( 'View and manage all your forms in one place.', 'jetpack-forms' ) }
				tabs={ <FormsResponsesTabs /> }
				hasPadding={ false }
			>
				<p style={ { fontWeight: 'bold', margin: '20px' } }>
					{ __( 'Forms will appear here', 'jetpack-forms' ) }
				</p>
			</Page>
		</div>
	);
}
