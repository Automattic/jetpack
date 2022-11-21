import { JetpackLogo } from '@automattic/jetpack-components';
import { PanelBody, PanelRow } from '@wordpress/components';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar.js';

export const name = 'test-plugin';

console.log( 'test-plugin/index.js' ); // this runs

export const settings = {
	render: function TestPlugin() {
		console.log( 'inside render' ); // this doesn't run

		const panelBodyProps = {
			name: 'test-plugin',
			title: __( 'Test Plugin', 'jetpack' ),
			className: 'test-plugin',
			icon: <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" />,
		};

		function TestPluginBodyContent() {
			return (
				<>
					<PanelRow>
						<p>Test Plugin Body Content</p>
					</PanelRow>
				</>
			);
		}

		return (
			<>
				<PluginPostPublishPanel { ...panelBodyProps }>
					<TestPluginBodyContent />
				</PluginPostPublishPanel>

				<JetpackPluginSidebar>
					<PanelBody { ...panelBodyProps }>
						<TestPluginBodyContent />
					</PanelBody>
				</JetpackPluginSidebar>
			</>
		);
	},
};
