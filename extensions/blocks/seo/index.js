/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { PanelBody } from '@wordpress/components';
import { PluginDocumentSettingPanel, PluginPrePublishPanel } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import './editor.scss';
import { isSimpleSite, isAtomicSite } from '../../shared/site-type-utils';
import JetpackLogo from '../../shared/jetpack-logo';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import SeoPanel from './panel';

const isWpcom = isSimpleSite() || isAtomicSite();
const title = __( 'SEO Description', 'jetpack' );

export const name = 'seo';

export const settings = {
	render: () => (
		<Fragment>
			{ // On WordPress.com the panel is in "Document" tab of the default editor sidebar
			isWpcom && (
				<PluginDocumentSettingPanel
					icon={ <JetpackLogo /> }
					name="jetpack-seo-description"
					title={ title }
				>
					<SeoPanel />
				</PluginDocumentSettingPanel>
			) }
			<JetpackPluginSidebar>
				<PanelBody title={ title }>
					<SeoPanel />
				</PanelBody>
			</JetpackPluginSidebar>
			<PluginPrePublishPanel
				initialOpen
				id="seo-title"
				title={
					<span id="seo-defaults" key="seo-title-span">
						{ title }
					</span>
				}
			>
				<SeoPanel />
			</PluginPrePublishPanel>
		</Fragment>
	),
};
