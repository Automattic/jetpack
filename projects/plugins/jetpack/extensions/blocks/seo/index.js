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
		const generalPanelProps = {
			title: __( 'SEO Description', 'jetpack' ),
			icon: <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" />,
		};

		const prePublishPanelProps = {
			...generalPanelProps,
			id: 'seo-title',
		};

		return (
			<Fragment>
				<JetpackPluginSidebar>
					<PanelBody { ...generalPanelProps }>
						<SeoPanel />
					</PanelBody>
				</JetpackPluginSidebar>
				<PluginPrePublishPanel { ...prePublishPanelProps }>
					<SeoPanel />
				</PluginPrePublishPanel>
			</Fragment>
		);
	},
};
