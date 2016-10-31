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

export const Writing = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule,
		userCanManageModules,
		sitePlan,
		fetchingSiteData,
		siteRawUrl
	} = props,
		isAdmin = userCanManageModules,
		moduleList = Object.keys( props.moduleList );
		nonAdminAvailable = [ 'after-the-deadline', 'post-by-email' ];
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';

export const Writing = React.createClass( {
	displayName: 'WritingSettings',

	propTypes: {
	},

	getMarkdownSettings() {
		return React.createClass( {
			render() {
				return (
					<form onSubmit={ this.props.onSubmit } >
						<FormFieldset>
							<ModuleSettingCheckbox
name={ 'wpcom_publish_comments_with_markdown' }
{ ...this.props }
label={ __( 'Use Markdown for comments' ) } />
						</FormFieldset>
					</form>
				);
			}
		} );
	},

	getAfterTheDeadlineSetting() {
		return React.createClass( {
			render() {
				return (
					<form onSubmit={ this.props.onSubmit } >
						<FormFieldset>
							<span className="jp-form-setting-explanation">
								{ __( 'Automatically proofread content when: ' ) }
							</span>
							<ModuleSettingCheckbox
								name={ 'onpublish' }
								{ ...this.props }
								label={ __( 'A post or page is first published' ) } />
							<ModuleSettingCheckbox
								name={ 'onupdate' }
								{ ...this.props }
								label={ __( 'A post or page is updated' ) } />
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
							<ModuleSettingCheckbox
								name={ 'guess_lang' }
								{ ...this.props }
								label={ __( 'Use automatically detected language to proofread posts and pages' ) } />
						</FormFieldset>
						<FormFieldset>
							<FormLegend> { __( 'English Options' ) } </FormLegend>
							<span className="jp-form-setting-explanation">
								{ __( 'Enable proofreading for the following grammar and style rules: ' ) }
							</span>
							<ModuleSettingCheckbox
								name={ 'Bias Language' }
								{ ...this.props }
								label={ __( 'Bias Language' ) } />
							<ModuleSettingCheckbox
								name={ 'Cliches' }
								{ ...this.props }
								label={ __( 'Clichés' ) } />
							<ModuleSettingCheckbox
								name={ 'Complex Expression' }
								{ ...this.props }
								label={ __( 'Complex Phrases' ) } />
							<ModuleSettingCheckbox
								name={ 'Diacritical Marks' }
								{ ...this.props }
								label={ __( 'Diacritical Marks' ) } />
							<ModuleSettingCheckbox
								name={ 'Double Negative' }
								{ ...this.props }
								label={ __( 'Double Negatives' ) } />
							<ModuleSettingCheckbox
								name={ 'Hidden Verbs' }
								{ ...this.props }
								label={ __( 'Hidden Verbs' ) } />
							<ModuleSettingCheckbox
								name={ 'Jargon Language' }
								{ ...this.props }
								label={ __( 'Jargon' ) } />
							<ModuleSettingCheckbox
								name={ 'Passive voice' }
								{ ...this.props }
								label={ __( 'Passive Voice' ) } />
							<ModuleSettingCheckbox
								name={ 'Phrases to Avoid' }
								{ ...this.props }
								label={ __( 'Phrases to Avoid' ) } />
							<ModuleSettingCheckbox
								name={ 'Redundant Expression' }
								{ ...this.props }
								label={ __( 'Redundant Phrases' ) } />
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
					</form>
				)
			}
		} );
	},

	render() {
		let Markdown = moduleSettingsForm( this.getMarkdownSettings() );
		let AfterTheDeadline = moduleSettingsForm( this.getAfterTheDeadlineSetting() );

		return (
			<div>
				<QuerySite />
				<SectionHeader label={ __( 'Composing', { context: 'Settings header' } ) }>
					<Button primary>
						{ __( 'Save', { context: 'Button caption' } ) }
					</Button>
				</SectionHeader>
				<Card>
					<Markdown module={ this.props.getModule( 'markdown' ) } />
					<AfterTheDeadline module={ this.props.getModule( 'atd' ) } />
				</Card>
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
