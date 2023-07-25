/**
 * External dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';
import { PanelBody, PanelRow } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../../../../shared/jetpack-plugin-sidebar';
import Proofread from '../proofread';

export default function AiAssistantPluginSidebar() {
	const title = __( 'AI Assistant', 'jetpack' );

	return (
		<>
			<JetpackPluginSidebar>
				<PanelBody title={ title } initialOpen={ false }>
					<PanelRow>
						<Proofread />
					</PanelRow>
				</PanelBody>
			</JetpackPluginSidebar>
			<PluginPrePublishPanel
				title={ title }
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
				initialOpen={ false }
			>
				<Proofread />
			</PluginPrePublishPanel>
		</>
	);
}
