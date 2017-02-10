/**
 * External dependencies
 */
import React from 'react';
import analytics from 'lib/analytics';
import { translate as __ } from 'i18n-calypso';
import FormToggle from 'components/form/form-toggle';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLegend
} from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import TagsInput from 'components/tags-input';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import InlineExpand from 'components/inline-expand';

export const Composing = moduleSettingsForm(
	React.createClass( {

		/**
		 * Get options for initial state.
		 *
		 * @returns {{onpublish: *, onupdate: *, guess_lang: *, Bias Language: *, Cliches: *, Complex Expression: *, Diacritical Marks: *, Double Negative: *, Hidden Verbs: *, Jargon Language: *, Passive voice: *, Phrases to Avoid: *, Redundant Expression: *}}
		 */
		getInitialState() {
			return {
				onpublish: this.props.getOptionValue( 'onpublish', 'after-the-deadline' ),
				onupdate: this.props.getOptionValue( 'onupdate', 'after-the-deadline' ),
				guess_lang: this.props.getOptionValue( 'guess_lang', 'after-the-deadline' ),
				'Bias Language': this.props.getOptionValue( 'Bias Language', 'after-the-deadline' ),
				'Cliches': this.props.getOptionValue( 'Cliches', 'after-the-deadline' ),
				'Complex Expression': this.props.getOptionValue( 'Complex Expression', 'after-the-deadline' ),
				'Diacritical Marks': this.props.getOptionValue( 'Diacritical Marks', 'after-the-deadline' ),
				'Double Negative': this.props.getOptionValue( 'Double Negative', 'after-the-deadline' ),
				'Hidden Verbs': this.props.getOptionValue( 'Hidden Verbs', 'after-the-deadline' ),
				'Jargon Language': this.props.getOptionValue( 'Jargon Language', 'after-the-deadline' ),
				'Passive voice': this.props.getOptionValue( 'Passive voice', 'after-the-deadline' ),
				'Phrases to Avoid': this.props.getOptionValue( 'Phrases to Avoid', 'after-the-deadline' ),
				'Redundant Expression': this.props.getOptionValue( 'Redundant Expression', 'after-the-deadline' )
			};
		},

		/**
		 * Update state so toggles are updated.
		 *
		 * @param {string} optionName
		 */
		updateOptions( optionName ) {
			this.setState(
				{
					[ optionName ]: ! this.state[ optionName ]
				},
				this.props.updateFormStateModuleOption( 'after-the-deadline', optionName )
			);
		},

		/**
		 * Render a toggle for a single option.
		 *
		 * @param {string} setting
		 * @param {string} label
		 * @returns {object}
		 */
		getToggle( setting, label ) {
			return(
				<FormToggle
					compact
					checked={ this.state[ setting ] }
					disabled={ ! this.props.getOptionValue( 'after-the-deadline' ) || this.props.isUnavailableInDevMode( 'after-the-deadline' ) || this.props.isSavingAnyOption( setting ) }
					onChange={ e => this.updateOptions( setting ) }>
					<span className="jp-form-toggle-explanation">
						{ label }
					</span>
				</FormToggle>
			);
		},

		getAtdSettings() {
			let ignoredPhrases = this.props.getOptionValue( 'ignored_phrases' );
			return (
				<div>
					<FormFieldset>
						<FormLegend> { __( 'Proofreading' ) } </FormLegend>
						<span className="jp-form-setting-explanation">
							{ __( 'Automatically proofread content when: ' ) }
						</span>
						{ this.getToggle( 'onpublish', __( 'A post or page is first published' ) ) }
						{ this.getToggle( 'onupdate', __( 'A post or page is updated' ) ) }
					</FormFieldset>
					<FormFieldset>
						<FormLegend> { __( 'Automatic Language Detection' ) }
						</FormLegend>
						<span className="jp-form-setting-explanation">
							{ __( 'The proofreader supports English, French, German, Portuguese and Spanish.' ) }
						</span>
						{
							this.getToggle(
								'guess_lang',
								__( 'Use automatically detected language to proofread posts and pages' )
							)
						}
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
						<FormLegend>
							{ __( 'Ignored Phrases' ) }
						</FormLegend>
						<TagsInput
							name="ignored_phrases"
							disabled={ ! this.props.getOptionValue( 'after-the-deadline' ) }
							placeholder={ __( 'Add a phrase' ) }
							value={
								'undefined' !== typeof ignoredPhrases && '' !== ignoredPhrases
								? ignoredPhrases.split( ',' )
								: []
							}
							onChange={ this.props.onOptionChange } />
					</FormFieldset>
				</div>
			);
		},

		render() {
			let markdown = this.props.getModule( 'markdown' ),
				atd = this.props.getModule( 'after-the-deadline' ),
				atdUnavailableInDevMode = this.props.isUnavailableInDevMode( 'after-the-deadline' );

			return (
				<SettingsCard header={ __( 'Composing', { context: 'Settings header' } ) } { ...this.props }>
					<SettingsGroup support={ markdown.learn_more_button }>
						<FormFieldset>
							<ModuleToggle
								slug="markdown"
								compact
								activated={ this.props.getOptionValue( 'markdown' ) }
								toggling={ this.props.isSavingAnyOption( 'markdown' ) }
								toggleModule={ this.props.toggleModuleNow }>
								<span className="jp-form-toggle-explanation">
									{ markdown.description }
								</span>
							</ModuleToggle>
						</FormFieldset>
					</SettingsGroup>
					<SettingsGroup hasChild disableInDevMode module={ atd }>
						<ModuleToggle
							slug="after-the-deadline"
							compact
							disabled={ atdUnavailableInDevMode }
							activated={ this.props.getOptionValue( 'after-the-deadline' ) }
							toggling={ this.props.isSavingAnyOption( 'after-the-deadline' ) }
							toggleModule={ this.props.toggleModuleNow }>
							<span className="jp-form-toggle-explanation">
								{ atd.description }
							</span>
						</ModuleToggle>
						<FormFieldset>
							<InlineExpand label={ __( 'Advanced Options' ) }>{ this.getAtdSettings() }</InlineExpand>
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
