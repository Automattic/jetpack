import { JetpackLogo } from '@automattic/jetpack-components';
import { PanelBody } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import SeoPanel from './panel';

import './editor.scss';

export const name = 'seo';

export const settings = {
	render: function JetpackSEODescriptionPanel() {
		const panelProps = {
			title: __( 'SEO Description', 'jetpack' ),
			icon: <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" />,
		};

		return (
			<Fragment>
				<JetpackPluginSidebar>
					<PanelBody { ...panelProps }>
						<SeoPanel />
					</PanelBody>
				</JetpackPluginSidebar>
				<PluginPrePublishPanel
					initialOpen
					id="seo-title"
					title={
						<span id="seo-defaults" key="seo-title-span">
							{ panelProps.title }
						</span>
					}
					icon={ panelProps.icon }
				>
					<SeoPanel />
				</PluginPrePublishPanel>
			</Fragment>
		);
	},
};
