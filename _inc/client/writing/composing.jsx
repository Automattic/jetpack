/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';
import FoldableCard from 'components/foldable-card';
import classNames from 'classnames';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLegend } from 'components/forms';
import { isModuleFound as _isModuleFound } from 'state/search';
import { ModuleToggle } from 'components/module-toggle';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { getModule } from 'state/modules';
import TagsInput from 'components/tags-input';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export class Composing extends React.Component {
	/**
	 * Get options for initial state.
	 *
	 * @return {Object} initialState {{
	 *		onpublish: *,
	 *		onupdate: *,
	 *		guess_lang: *,
	 *		Bias Language: *,
	 *		Cliches: *,
	 *		Complex Expression: *,
	 *		Diacritical Marks: *,
	 *		Double Negative: *,
	 *		Hidden Verbs: *,
	 *		Jargon Language: *,
	 *		Passive voice: *,
	 *		Phrases to Avoid: *,
	 *		Redundant Expression: *
	 * }}
	 */
	state = {
		onpublish: this.props.getOptionValue( 'onpublish', 'after-the-deadline' ),
		onupdate: this.props.getOptionValue( 'onupdate', 'after-the-deadline' ),
		guess_lang: this.props.getOptionValue( 'guess_lang', 'after-the-deadline' ),
		'Bias Language': this.props.getOptionValue( 'Bias Language', 'after-the-deadline' ),
		Cliches: this.props.getOptionValue( 'Cliches', 'after-the-deadline' ),
		'Complex Expression': this.props.getOptionValue( 'Complex Expression', 'after-the-deadline' ),
		'Diacritical Marks': this.props.getOptionValue( 'Diacritical Marks', 'after-the-deadline' ),
		'Double Negative': this.props.getOptionValue( 'Double Negative', 'after-the-deadline' ),
		'Hidden Verbs': this.props.getOptionValue( 'Hidden Verbs', 'after-the-deadline' ),
		'Jargon Language': this.props.getOptionValue( 'Jargon Language', 'after-the-deadline' ),
		'Passive voice': this.props.getOptionValue( 'Passive voice', 'after-the-deadline' ),
		'Phrases to Avoid': this.props.getOptionValue( 'Phrases to Avoid', 'after-the-deadline' ),
		'Redundant Expression': this.props.getOptionValue(
			'Redundant Expression',
			'after-the-deadline'
		),
	};

	/**
	 * Update state so toggles are updated.
	 *
	 * @param {string} optionName slug of an option to be updated
	 */
	updateOptions = optionName => {
		this.setState(
			{
				[ optionName ]: ! this.state[ optionName ],
			},
			this.props.updateFormStateModuleOption( 'after-the-deadline', optionName )
		);
	};

	handleToggleChange = setting => {
		return () => this.updateOptions( setting );
	};

	/**
	 * Render a toggle for a single option.
	 *
	 * @param {string} setting the slug for the option
	 * @param {string} label   text label to be displayed with the toggle
	 * @returns {object} React element object
	 */
	getToggle = ( setting, label ) => {
		return (
			<CompactFormToggle
				checked={ this.state[ setting ] }
				disabled={
					! this.props.getOptionValue( 'after-the-deadline' ) ||
					this.props.isUnavailableInDevMode( 'after-the-deadline' ) ||
					this.props.isSavingAnyOption( [ 'after-the-deadline', setting ] )
				}
				onChange={ this.handleToggleChange( setting ) }
			>
				<span className="jp-form-toggle-explanation">{ label }</span>
			</CompactFormToggle>
		);
	};

	getAtdSettings = () => {
		const ignoredPhrases = this.props.getOptionValue( 'ignored_phrases' );
		return (
			<SettingsGroup
				hasChild
				disableInDevMode
				module={ this.props.getModule( 'after-the-deadline' ) }
				support={ {
					text: __(
						'Checks your content for correct grammar and spelling, ' +
							'misused words, and style while you write.'
					),
					link: 'https://jetpack.com/support/spelling-and-grammar/',
				} }
			>
				<FormFieldset>
					<FormLegend> { __( 'Proofreading' ) } </FormLegend>
					<span className="jp-form-setting-explanation">
						{ __( 'Automatically proofread content when: ' ) }
					</span>
					{ this.getToggle( 'onpublish', __( 'A post or page is first published' ) ) }
					{ this.getToggle( 'onupdate', __( 'A post or page is updated' ) ) }
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'Automatic Language Detection' ) }</FormLegend>
					<span className="jp-form-setting-explanation">
						{ __( 'The proofreader supports English, French, German, Portuguese and Spanish.' ) }
					</span>
					{ this.getToggle(
						'guess_lang',
						__( 'Use automatically detected language to proofread posts and pages' )
					) }
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'English Options' ) } </FormLegend>
					<span className="jp-form-setting-explanation">
						{ __( 'Enable proofreading for the following grammar and style rules: ' ) }
					</span>
					{ this.getToggle( 'Bias Language', __( 'Bias Language' ) ) }
					{ this.getToggle( 'Cliches', __( 'Clichés' ) ) }
					{ this.getToggle( 'Complex Expression', __( 'Complex Phrases' ) ) }
					{ this.getToggle( 'Diacritical Marks', __( 'Diacritical Marks' ) ) }
					{ this.getToggle( 'Double Negative', __( 'Double Negatives' ) ) }
					{ this.getToggle( 'Hidden Verbs', __( 'Hidden Verbs' ) ) }
					{ this.getToggle( 'Jargon Language', __( 'Jargon' ) ) }
					{ this.getToggle( 'Passive voice', __( 'Passive Voice' ) ) }
					{ this.getToggle( 'Phrases to Avoid', __( 'Phrases to Avoid' ) ) }
					{ this.getToggle( 'Redundant Expression', __( 'Redundant Phrases' ) ) }
				</FormFieldset>
				<FormFieldset>
					<FormLegend>{ __( 'Ignored Phrases' ) }</FormLegend>
					<TagsInput
						name="ignored_phrases"
						disabled={ ! this.props.getOptionValue( 'after-the-deadline' ) }
						placeholder={ __( 'Add a phrase' ) }
						value={
							'undefined' !== typeof ignoredPhrases && '' !== ignoredPhrases
								? ignoredPhrases.split( ',' )
								: []
						}
						onChange={ this.props.onOptionChange }
					/>
					<span className="jp-form-setting-explanation">
						{ __( 'Confirm each new phrase you add by pressing enter.' ) }
					</span>
				</FormFieldset>
			</SettingsGroup>
		);
	};

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

	trackOpenCard = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'foldable-settings-open',
			feature: 'atd',
		} );
	};

	render() {
		const foundCopyPost = this.props.isModuleFound( 'copy-post' ),
			foundAtD = this.props.isModuleFound( 'after-the-deadline' ),
			foundMarkdown = this.props.isModuleFound( 'markdown' );

		if ( ! foundCopyPost && ! foundMarkdown && ! foundAtD ) {
			return null;
		}

		const markdown = this.props.module( 'markdown' ),
			atd = this.props.module( 'after-the-deadline' ),
			copyPost = this.props.module( 'copy-post' ),
			unavailableInDevMode = this.props.isUnavailableInDevMode( 'after-the-deadline' ),
			copyPostSettings = (
				<SettingsGroup
					module={ copyPost }
					support={ {
						text: __(
							'Duplicate existing posts, pages, Testimonials, and Portfolios. ' +
								'All the content will be copied including text, featured images, sharing settings, and more.'
						),
						link: 'https://jetpack.com/support/copy-post-2/',
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
							'Allows you to compose content with links, lists, and other styles using the Markdown syntax.'
						),
						link: 'https://jetpack.com/support/markdown/',
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
			atdSettings = (
				<FoldableCard
					onOpen={ this.trackOpenCard }
					className={ classNames( 'jp-foldable-card__main-settings', {
						'jp-foldable-settings-disable': unavailableInDevMode,
					} ) }
					header={
						this.props.userCanManageModules ? (
							<ModuleToggle
								slug="after-the-deadline"
								compact
								disabled={ unavailableInDevMode }
								activated={ this.props.getOptionValue( 'after-the-deadline' ) }
								toggling={ this.props.isSavingAnyOption( 'after-the-deadline' ) }
								toggleModule={ this.props.toggleModuleNow }
							>
								<span className="jp-form-toggle-explanation">{ atd.description }</span>
							</ModuleToggle>
						) : (
							<span className="jp-form-toggle-explanation">{ atd.description }</span>
						)
					}
				>
					{ this.getAtdSettings() }
				</FoldableCard>
			);

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Composing', { context: 'Settings header' } ) }
				hideButton={ ! foundAtD }
				module="composing"
				saveDisabled={ this.props.isSavingAnyOption( 'ignored_phrases' ) }
			>
				{ foundCopyPost && copyPostSettings }
				{ foundMarkdown && markdownSettings }
				{ foundAtD && atdSettings }
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
