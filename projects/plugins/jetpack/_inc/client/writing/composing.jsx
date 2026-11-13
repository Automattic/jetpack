import { getRedirectUrl } from '@automattic/jetpack-components';
import { currentUserCan } from '@automattic/jetpack-script-data';
import { getJetpackAiManageUrl } from '@automattic/jetpack-shared-extension-utils';
import { __, _x } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
import CompactCard from 'components/card/compact';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import { FeaturesPointer } from 'components/pointer-card';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import {
	isInSettingsPanel,
	isSwitchedInFeatures as _isSwitchedInFeatures,
} from 'lib/settings-consolidation';
import { showMyJetpack } from 'state/initial-state';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound, getSearchTerm } from 'state/search';
import { MarkdownMoved } from './markdown-moved';

// Card order.
const COMPOSING_MODULES = [ 'copy-post', 'markdown', 'latex', 'shortcodes', 'blocks' ];

export class Composing extends Component {
	/**
	 * If markdown module is inactive and this is toggling markdown for posts on, activate module.
	 * If markdown for comments is off and this is toggling markdown for posts off, deactivate module.
	 *
	 * @param {string} module - the slug of the module to update
	 * @return {*}           the updated value
	 */
	updateFormStateByMarkdown = module => {
		if ( this.props.getSettingCurrentValue( 'wpcom_publish_comments_with_markdown', module ) ) {
			return this.props.updateFormStateModuleOption( module, 'wpcom_publish_posts_with_markdown' );
		}
		return this.props.updateFormStateModuleOption(
			module,
			'wpcom_publish_posts_with_markdown',
			true
		);
	};

	/**
	 * Update the option that disables Jetpack Blocks.
	 *
	 * @return {*}           the updated value
	 */
	toggleBlocks = () => {
		const updateValue = ! this.props.getSettingCurrentValue( 'jetpack_blocks_disabled' );
		return this.props.updateOptions( { jetpack_blocks_disabled: updateValue } );
	};

	render() {
		const { isMarkdownMoved, isModuleFound, isSwitchedInFeatures } = this.props,
			isFound = module => ! isSwitchedInFeatures( module ) && isModuleFound( module ),
			foundCopyPost = isFound( 'copy-post' ),
			foundLatex = isFound( 'latex' ),
			foundMarkdown = ! isMarkdownMoved && isFound( 'markdown' ),
			pointsToMarkdown = isMarkdownMoved && !! this.props.searchTerm && isModuleFound( 'markdown' ),
			foundShortcodes = isFound( 'shortcodes' ),
			foundBlocks = isFound( 'blocks' ),
			foundMyJetpack = this.props.isMyJetpackReachable,
			foundCard = foundCopyPost || foundLatex || foundMarkdown || foundShortcodes || foundBlocks,
			pointedModules = this.props.searchTerm
				? COMPOSING_MODULES.filter(
						module => isSwitchedInFeatures( module ) && isModuleFound( module )
					)
				: [];

		if ( ! foundCard && ! pointedModules.length && ! pointsToMarkdown ) {
			return null;
		}

		const markdown = this.props.module( 'markdown' ),
			latex = this.props.module( 'latex' ),
			copyPost = this.props.module( 'copy-post' ),
			shortcodes = this.props.module( 'shortcodes' ),
			blocks = this.props.module( 'blocks' ),
			copyPostSettings = (
				<SettingsGroup
					module={ copyPost }
					support={ {
						text: __(
							'Duplicate existing posts, pages, Testimonials, and Portfolios. All the content will be copied including text, featured images, sharing settings, and more.',
							'jetpack'
						),
						link: getRedirectUrl( 'jetpack-support-copy-post' ),
						wpcomLink: 'https://wordpress.com/support/copy-a-post-or-page/',
					} }
				>
					<FormFieldset>
						<ModuleToggle
							slug="copy-post"
							disabled={ this.props.isSavingAnyOption( 'copy-post' ) }
							activated={ !! this.props.getOptionValue( 'copy-post' ) }
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
						wpcomLink: 'https://wordpress.com/support/wordpress-editor/blocks/markdown-block/',
					} }
				>
					<FormFieldset>
						<ModuleToggle
							slug="markdown"
							disabled={ this.props.isSavingAnyOption( [
								'markdown',
								'wpcom_publish_posts_with_markdown',
							] ) }
							activated={
								!! this.props.getOptionValue( 'wpcom_publish_posts_with_markdown', 'markdown' )
							}
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
						wpcomLink: 'https://wordpress.com/support/latex/',
					} }
				>
					<FormFieldset>
						<ModuleToggle
							slug="latex"
							disabled={ this.props.isSavingAnyOption( [ 'latex' ] ) }
							activated={ !! this.props.getOptionValue( 'latex' ) }
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
						wpcomLink: 'https://wordpress.com/support/wordpress-editor/blocks/shortcode-block/',
					} }
				>
					<FormFieldset>
						<ModuleToggle
							slug="shortcodes"
							disabled={ this.props.isSavingAnyOption( [ 'shortcodes' ] ) }
							activated={ !! this.props.getOptionValue( 'shortcodes' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Compose using shortcodes to embed media from popular sites', 'jetpack' ) }
							</span>
						</ModuleToggle>
					</FormFieldset>
				</SettingsGroup>
			),
			blocksSettings = (
				<>
					<SettingsGroup
						module={ blocks }
						support={ {
							text: __(
								'Jetpack includes some blocks which can help you create your pages exactly the way you want them.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-blocks' ),
						} }
					>
						<FormFieldset>
							<ModuleToggle
								slug="blocks"
								disabled={ this.props.isSavingAnyOption( [ 'blocks' ] ) }
								activated={ !! this.props.getOptionValue( 'blocks' ) }
								toggleModule={ this.props.toggleModuleNow }
							>
								<span className="jp-form-toggle-explanation">
									{ __(
										'Jetpack Blocks give you the power to deliver quality content that hooks website visitors without needing to hire a developer or learn a single line of code.',
										'jetpack'
									) }
								</span>
								{ this.props.getOptionValue( 'blocks' ) && (
									<span className="jp-form-setting-explanation">
										{ __(
											'Caution: if there are Jetpack blocks used in existing posts or pages, disabling this setting will cause those blocks to stop working.',
											'jetpack'
										) }
									</span>
								) }
							</ModuleToggle>
						</FormFieldset>
					</SettingsGroup>
					<CompactCard
						className="jp-settings-card__configure-link"
						href={ `${ this.props.siteAdminUrl }post-new.php` }
					>
						{ __( 'Discover Jetpack tools in the block editor', 'jetpack' ) }
					</CompactCard>
				</>
			),
			aiAssistantLink = (
				<CompactCard className="jp-settings-card__configure-link">
					<a
						href={
							currentUserCan( 'manage_options' )
								? getJetpackAiManageUrl()
								: getRedirectUrl( 'org-ai' )
						}
					>
						{ __( 'Learn more about all Jetpack AI features', 'jetpack' ) }
					</a>
				</CompactCard>
			);

		return (
			<>
				{ foundCard && (
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
						{ foundBlocks && blocksSettings }
						{ foundMyJetpack &&
							! this.props.getOptionValue( 'jetpack_blocks_disabled' ) &&
							aiAssistantLink }
					</SettingsCard>
				) }
				{ pointedModules.map( module => {
					const { name } = this.props.module( module );
					return (
						<FeaturesPointer
							key={ module }
							header={ name }
							name={ name }
							search={ name }
							linksToSettings={ false }
						/>
					);
				} ) }
				{ pointsToMarkdown && <MarkdownMoved getModule={ this.props.module } /> }
			</>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
		isSwitchedInFeatures: module_name => _isSwitchedInFeatures( state, module_name ),
		isMarkdownMoved: isInSettingsPanel( state ),
		isMyJetpackReachable: showMyJetpack( state ),
		searchTerm: getSearchTerm( state ),
	};
} )( withModuleSettingsFormHelpers( Composing ) );
