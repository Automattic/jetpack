/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { __, _x } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { FormFieldset } from 'components/forms';
import { isModuleFound as _isModuleFound } from 'state/search';
import { ModuleToggle } from 'components/module-toggle';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { getModule } from 'state/modules';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export class Composing extends React.Component {
	/**
	 * If markdown module is inactive and this is toggling markdown for posts on, activate module.
	 * If markdown for comments is off and this is toggling markdown for posts off, deactivate module.
	 *
	 * @param {string} module the slug of the module to update
	 * @returns {*}           the updated value
	 */
	updateFormStateByMarkdown = module => {
		if ( !! this.props.getSettingCurrentValue( 'wpcom_publish_comments_with_markdown', module ) ) {
			return this.props.updateFormStateModuleOption( module, 'wpcom_publish_posts_with_markdown' );
		}
		return this.props.updateFormStateModuleOption(
			module,
			'wpcom_publish_posts_with_markdown',
			true
		);
	};

	render() {
		const foundCopyPost = this.props.isModuleFound( 'copy-post' ),
			foundLatex = this.props.isModuleFound( 'latex' ),
			foundMarkdown = this.props.isModuleFound( 'markdown' ),
			foundShortcodes = this.props.isModuleFound( 'shortcodes' );

		if ( ! foundCopyPost && ! foundLatex && ! foundMarkdown && ! foundShortcodes ) {
			return null;
		}

		const markdown = this.props.module( 'markdown' ),
			latex = this.props.module( 'latex' ),
			copyPost = this.props.module( 'copy-post' ),
			shortcodes = this.props.module( 'shortcodes' ),
			copyPostSettings = (
				<SettingsGroup
					module={ copyPost }
					support={ {
						text: __(
							'Duplicate existing posts, pages, Testimonials, and Portfolios. All the content will be copied including text, featured images, sharing settings, and more.',
							'jetpack'
						),
						link: getRedirectUrl( 'jetpack-support-copy-post' ),
					} }
				>
					<FormFieldset>
						<ModuleToggle
							slug="copy-post"
							activated={ !! this.props.getOptionValue( 'copy-post' ) }
							toggling={ this.props.isSavingAnyOption( 'copy-post' ) }
							disabled={ this.props.isSavingAnyOption( 'copy-post' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">{ copyPost.description }</span>
						</ModuleToggle>
					</FormFieldset>
				</SettingsGroup>
			),
			markdownSettings = (
				<SettingsGroup
					module={ markdown }
					support={ {
						text: __(
							'Use Markdown syntax to compose content with links, lists, and other styles. This setting enables Markdown in the Classic Editor as well as within a Classic Editor block.',
							'jetpack'
						),
						link: getRedirectUrl( 'jetpack-support-markdown' ),
					} }
				>
					<FormFieldset>
						<ModuleToggle
							slug="markdown"
							activated={
								!! this.props.getOptionValue( 'wpcom_publish_posts_with_markdown', 'markdown' )
							}
							toggling={ this.props.isSavingAnyOption( [
								'markdown',
								'wpcom_publish_posts_with_markdown',
							] ) }
							disabled={ this.props.isSavingAnyOption( [
								'markdown',
								'wpcom_publish_posts_with_markdown',
							] ) }
							toggleModule={ this.updateFormStateByMarkdown }
						>
							<span className="jp-form-toggle-explanation">{ markdown.description }</span>
						</ModuleToggle>
					</FormFieldset>
				</SettingsGroup>
			),
			latexSettings = (
				<SettingsGroup
					module={ latex }
					support={ {
						text: __(
							'LaTeX is a powerful markup language for writing complex mathematical equations and formulas.',
							'jetpack'
						),
						link: getRedirectUrl( 'jetpack-support-beautiful-math-with-latex' ),
					} }
				>
					<FormFieldset>
						<ModuleToggle
							slug="latex"
							activated={ !! this.props.getOptionValue( 'latex' ) }
							toggling={ this.props.isSavingAnyOption( [ 'latex' ] ) }
							disabled={ this.props.isSavingAnyOption( [ 'latex' ] ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">{ latex.description }</span>
						</ModuleToggle>
					</FormFieldset>
				</SettingsGroup>
			),
			shortcodeSettings = (
				<SettingsGroup
					module={ shortcodes }
					support={ {
						text: shortcodes.description,
						link: getRedirectUrl( 'jetpack-support-shortcode-embeds' ),
					} }
				>
					<FormFieldset>
						<ModuleToggle
							slug="shortcodes"
							activated={ !! this.props.getOptionValue( 'shortcodes' ) }
							toggling={ this.props.isSavingAnyOption( [ 'shortcodes' ] ) }
							disabled={ this.props.isSavingAnyOption( [ 'shortcodes' ] ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Compose using shortcodes to embed media from popular sites', 'jetpack' ) }
							</span>
						</ModuleToggle>
					</FormFieldset>
				</SettingsGroup>
			);

		return (
			<SettingsCard
				{ ...this.props }
				header={ _x( 'Composing', 'Settings header', 'jetpack' ) }
				module="composing"
				saveDisabled={ this.props.isSavingAnyOption( 'ignored_phrases' ) }
			>
				{ foundCopyPost && copyPostSettings }
				{ foundMarkdown && markdownSettings }
				{ foundLatex && latexSettings }
				{ foundShortcodes && shortcodeSettings }
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
	};
} )( withModuleSettingsFormHelpers( Composing ) );
