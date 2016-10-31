/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Card from 'components/card';
import SectionHeader from 'components/section-header';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import TagsInput from 'components/tags-input';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule,
	getModules
} from 'state/modules';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';
import {
	FormFieldset,
	FormLegend,
	FormLabel,
	FormButton
} from 'components/forms';
import {
	ModuleSettingRadios,
	ModuleSettingCheckbox,
	ModuleSettingMultipleSelectCheckboxes
} from 'components/module-settings/form-components';
import QuerySite from 'components/data/query-site';
import ProStatus from 'pro-status';
import { ModuleToggle } from 'components/module-toggle';
import { AllModuleSettings } from 'components/module-settings/modules-per-tab-page';
import { isUnavailableInDevMode } from 'state/connection';
import { userCanManageModules as _userCanManageModules } from 'state/initial-state';
import { getSiteRawUrl } from 'state/initial-state';

import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';

export const Writing = React.createClass( {
	displayName: 'WritingSettings',

	propTypes: {
	},

	render() {
		let markdown = this.props.getModule( 'markdown' );
		let atd = this.props.getModule( 'after-the-deadline' );

		let Composing = moduleSettingsForm(
			React.createClass( {
				getCheckbox( setting, label, isAtd = true ) {
					return(
						<ModuleSettingCheckbox
							name={ setting }
							module={ isAtd ? atd : markdown }
							label={ label }
							{ ...this.props }
						/>
					);
				},

				render() {
					return (
						<form>
							<SectionHeader label={ __( 'Composing', { context: 'Settings header' } ) }>
								<Button
									primary
									isSubmitting={ this.props.isSavingAnyOption() }
									disabled={ this.props.shouldSaveButtonBeDisabled() }
									onClick={ this.props.onSubmit }
								>
									{ __( 'Save', { context: 'Button caption' } ) }
								</Button>
							</SectionHeader>
							<Card>
								<FormFieldset>
									{
										this.getCheckbox(
											'wpcom_publish_comments_with_markdown',
											__( 'Use Markdown for comments' ),
											true
										)
									}
								</FormFieldset>
								<FormFieldset>
									<span className="jp-form-setting-explanation">
										{ __( 'Automatically proofread content when: ' ) }
									</span>
									{ this.getCheckbox( 'onpublish', __( 'A post or page is first published' ) ) }
									{ this.getCheckbox( 'onupdate', __( 'A post or page is updated' ) ) }
								</FormFieldset>
								<FormFieldset>
									<FormLegend> { __( 'Automatic Language Detection' ) }
									</FormLegend>
									<span className="jp-form-setting-explanation">
										{ __(
											  'The proofreader supports English, French, ' +
											  'German, Portuguese and Spanish.'
										  ) }
									</span>
									{
										this.getCheckbox(
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
									{ this.getCheckbox( 'Bias Language', __( 'Bias Language' ) ) }
									{ this.getCheckbox( 'Cliches', __( 'Clichés' ) ) }
									{ this.getCheckbox( 'Complex Expression', __( 'Complex Phrases' ) ) }
									{ this.getCheckbox( 'Diacritical Marks', __( 'Diacritical Marks' ) ) }
									{ this.getCheckbox( 'Double Negative', __( 'Double Negatives' ) ) }
									{ this.getCheckbox( 'Hidden Verbs', __( 'Hidden Verbs' ) ) }
									{ this.getCheckbox( 'Jargon Language', __( 'Jargon' ) ) }
									{ this.getCheckbox( 'Passive voice', __( 'Passive Voice' ) ) }
									{ this.getCheckbox( 'Phrases to Avoid', __( 'Phrases to Avoid' ) ) }
									{ this.getCheckbox( 'Redundant Expression', __( 'Redundant Phrases' ) ) }
								</FormFieldset>
								<FormFieldset>
									<FormLegend>
										{ __( 'Ignored Phrases' ) }
									</FormLegend>
									<TagsInput
										name="ignored_phrases"
										placeholder={ __( 'Add a phrase' ) }
										value={
											(
												'undefined' !== typeof this.props.getOptionValue( 'ignored_phrases' )
												&& '' !== this.props.getOptionValue( 'ignored_phrases' )
											) ?
											   this.props.getOptionValue( 'ignored_phrases' ).split( ',' ) :
											   []
											  }
										onChange={ this.props.onOptionChange } />
								</FormFieldset>
							</Card>
						</form>
					);
				}
			} )
		);

		return (
			<div>
				<QuerySite />
				<Composing module={ [ atd, markdown ] } />
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isTogglingModule: ( module_name ) =>
			isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name ),
			isUnavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
			userCanManageModules: _userCanManageModules( state ),
			moduleList: getModules( state ),
			sitePlan: getSitePlan( state ),
			fetchingSiteData: isFetchingSiteData( state ),
			siteRawUrl: getSiteRawUrl( state )
		};
	},
	( dispatch ) => {
		return {
			toggleModule: ( module_name, activated ) => {
				return ( activated )
					? dispatch( deactivateModule( module_name ) )
					: dispatch( activateModule( module_name ) );
			}
		};
	}
)( Writing );
