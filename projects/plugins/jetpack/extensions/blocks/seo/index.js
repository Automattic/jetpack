import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody, PanelRow } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import SeoDescriptionPanel from './description-panel';
import SeoNoindexPanel from './noindex-panel';
import SeoTitlePanel from './title-panel';

import './editor.scss';

export const name = 'seo';

export const settings = {
	render: () => {
		const jetpackSeoPanelProps = {
			title: __( 'SEO', 'jetpack' ),
		};

		const jetpackSeoPrePublishPanelProps = {
			icon: <JetpackEditorPanelLogo />,
			title: __( 'SEO', 'jetpack' ),
		};

		return (
			<Fragment>
				<JetpackPluginSidebar>
					<PanelBody className="jetpack-seo-panel" { ...jetpackSeoPanelProps }>
						<PanelRow>
							<SeoTitlePanel />
						</PanelRow>
						<PanelRow>
							<SeoDescriptionPanel />
						</PanelRow>
						<PanelRow>
							<SeoNoindexPanel />
						</PanelRow>
					</PanelBody>
				</JetpackPluginSidebar>

				<PluginPrePublishPanel { ...jetpackSeoPrePublishPanelProps }>
					<Fragment>
						<PanelRow>
							<SeoTitlePanel />
						</PanelRow>
						<PanelRow>
							<SeoDescriptionPanel />
						</PanelRow>
						<PanelRow>
							<SeoNoindexPanel />
						</PanelRow>
					</Fragment>
				</PluginPrePublishPanel>
			</Fragment>
		);
	},
};
