/**
 * External dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';
import { PanelBody } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../../../../shared/jetpack-plugin-sidebar';

const isPluginSidebarVisible =
	window?.Jetpack_Editor_Initial_State?.[ 'ai-assistant' ]?.[ 'is-plugin-sidebar-visible' ];

export default function AiAssistantPluginSidebar() {
	const title = __( 'AI Assistant', 'jetpack' );

	if ( ! isPluginSidebarVisible ) {
		return null;
	}

	return (
		<>
			<JetpackPluginSidebar>
				<PanelBody title={ title } initialOpen={ false }>
					<p>AI Assistant is a tool that helps you write better content.</p>
				</PanelBody>
			</JetpackPluginSidebar>
			<PluginPrePublishPanel
				title={ title }
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
				initialOpen={ false }
			>
				<p>AI Assistant is a tool that helps you write better content.</p>
			</PluginPrePublishPanel>
		</>
	);
}
