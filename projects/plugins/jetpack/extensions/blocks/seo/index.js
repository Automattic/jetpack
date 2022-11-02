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

		const prePublishPanelProps = {
			...generalPanelProps,
			title: __( 'SEO Description', 'jetpack' ),
			id: 'seo-title',
		};

		return (
			<Fragment>
				<JetpackPluginSidebar>
					<PanelBody { ...generalPanelProps } title={ __( 'SEO Title', 'jetpack' ) }>
						<SeoTitlePanel />
					</PanelBody>
					<PanelBody { ...generalPanelProps } title={ __( 'SEO Description', 'jetpack' ) }>
						<SeoDescriptionPanel />
					</PanelBody>
				</JetpackPluginSidebar>
				{ /* TODO: Add Seo Title to PrePublishPanel */ }
				<PluginPrePublishPanel { ...prePublishPanelProps }>
					<SeoDescriptionPanel />
				</PluginPrePublishPanel>
			</Fragment>
		);
	},
};
