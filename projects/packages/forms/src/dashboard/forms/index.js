/**
 * Internal dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import useConfigValue from '../../hooks/use-config-value.ts';
import CreateFormButton from '../components/create-form-button/index.tsx';
import FormsResponsesToggleButton from '../components/forms-responses-toggle-button/index.tsx';
import IntegrationsButton from '../components/integrations-button/index.tsx';
import Page from '../components/page/index.tsx';
import FormsView from './dataviews/index.js';
import './style.scss';

const Forms = () => {
	const isIntegrationsEnabled = useConfigValue( 'isIntegrationsEnabled' );
	const showDashboardIntegrations = useConfigValue( 'showDashboardIntegrations' );

	const actions = [
		<FormsResponsesToggleButton key="toggle" />,
		...( isIntegrationsEnabled && showDashboardIntegrations
			? [ <IntegrationsButton key="integrations" /> ]
			: [] ),
		<CreateFormButton key="create" />,
	];

	return (
		<div className="jp-forms-layout__surface is-stage">
			<Page
				title={
					<div className="jp-forms-page-header-title">
						<JetpackLogo showText={ false } width={ 20 } />
						{ __( 'Forms', 'jetpack-forms' ) }
					</div>
				}
				subTitle={ __( 'Create and manage your forms in one place.', 'jetpack-forms' ) }
				actions={ actions }
				hasPadding={ false }
			>
				<FormsView />
			</Page>
		</div>
	);
};

export default Forms;
