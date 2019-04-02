/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { PanelBody } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import './editor.scss';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import SeoPanel from './panel';

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
			>
				<SeoPanel />
			</PluginPrePublishPanel>
		</Fragment>
	),
};
