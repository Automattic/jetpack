/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import { FormFieldset } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleSettingCheckbox } from 'components/module-settings/form-components';
import {
	SettingsCard
} from 'components/settings-card';

export const ThemeEnhancements = moduleSettingsForm(
	React.createClass( {

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Theme Enhancements' ) }>
					{
						[
							{
								...this.props.getModule( 'infinite-scroll' ),
								checkboxes: [
									{
										key: 'infinite_scroll',
										label: __( 'Scroll infinitely (Shows 7 posts on each load)' )
									},
									{
										key: 'infinite_scroll_google_analytics',
										label: __( 'Track each infinite Scroll post load as a page view in Google Analytics' )
									}
								]
							},
							{
								...this.props.getModule( 'minileven' ),
								checkboxes: [
									{
										key: 'wp_mobile_excerpt',
										label: __( 'Use excerpts instead of full posts on front page and archive pages' )
									},
									{
										key: 'wp_mobile_featured_images',
										label: __( 'Show featured images' )
									},
									{
										key: 'wp_mobile_app_promos',
										label: __( 'Show an ad for the WordPress mobile apps in the footer of the mobile theme' )
									}
								]
							}
						].map( item => {
							return (
								<Card compact className="jp-form-has-child jp-form-settings-group" key={ `theme_enhancement_${ item.module }` }>
									<ModuleToggle slug={ item.module }
										compact
										activated={ this.props.getOptionValue( item.module ) }
										toggling={ this.props.isSavingAnyOption( item.module ) }
										toggleModule={ this.props.toggleModuleNow }>
									<span className="jp-form-toggle-explanation">
									{
										item.description
									}
									</span>
									</ModuleToggle>
									<FormFieldset support={ item.learn_more_button }>
										{
											this.props.getOptionValue( item.module )
												? item.checkboxes.map( chkbx => {
													return <ModuleSettingCheckbox
														name={ chkbx.key }
														{ ...this.props }
														label={ chkbx.label }
														key={ `${ item.module }_${ chkbx.key }`}
													/>
												} )
												: ''
										}
									</FormFieldset>
								</Card>
							);
						} )
					}
				</SettingsCard>
			);
		}
	} )
);
