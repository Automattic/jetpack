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
	render: () => (
		<Fragment>
			<JetpackPluginSidebar>
				<PanelBody title={ __( 'SEO Description', 'jetpack' ) }>
					<SeoPanel />
				</PanelBody>
			</JetpackPluginSidebar>
			<PluginPrePublishPanel
				initialOpen
				id="seo-title"
				title={
					<span id="seo-defaults" key="seo-title-span">
						{ __( 'SEO Description', 'jetpack' ) }
					</span>
				}
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#444444" /> }
			>
				<SeoPanel />
			</PluginPrePublishPanel>
		</Fragment>
	),
};
