import { JetpackLogo } from '@automattic/jetpack-components';
import { PanelBody } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import SeoDescriptionPanel from './description-panel';
import SeoTitlePanel from './title-panel';

import './editor.scss';

export const name = 'seo';

export const settings = {
	render: function JetpackSEODescriptionPanel() {
		const generalPanelProps = {
			icon: <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" />,
		};

		const titlePanelProps = {
			...generalPanelProps,
			title: __( 'SEO Page Title', 'jetpack' ),
		};

		const descriptionPanelProps = {
			...generalPanelProps,
			title: __( 'SEO Description', 'jetpack' ),
		};

		return (
			<Fragment>
				<JetpackPluginSidebar>
					<PanelBody { ...titlePanelProps }>
						<SeoTitlePanel />
					</PanelBody>
					<PanelBody { ...descriptionPanelProps }>
						<SeoDescriptionPanel />
					</PanelBody>
				</JetpackPluginSidebar>

				<PluginPrePublishPanel { ...titlePanelProps }>
					<SeoTitlePanel />
				</PluginPrePublishPanel>
				<PluginPrePublishPanel { ...descriptionPanelProps }>
					<SeoDescriptionPanel />
				</PluginPrePublishPanel>
			</Fragment>
		);
	},
};
