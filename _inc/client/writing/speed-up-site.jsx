/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import { unescape } from 'lodash';

/**
 * Internal dependencies
 */
import { FormFieldset } from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

const SpeedUpSite = moduleSettingsForm(
	React.createClass( {
		toggleModule( name, value ) {
			if ( 'photon' === name ) {
				// Carousel depends on Photon. Deactivate it if Photon is deactivated.
				if ( false === ! value ) {
					this.props.updateOptions( { photon: false, 'tiled-gallery': false, tiled_galleries: false } );
				} else {
					this.props.updateOptions( { photon: true, 'tiled-gallery': true, tiled_galleries: true } );
				}
			} else {
				this.props.updateOptions( { [ name ]: ! value } );
			}
		},

		decodeEntities( text ) {
			if ( 'undefined' === typeof DOMParser ) {
				return text;
			}

			const document = new DOMParser().parseFromString( text, 'text/html' );
			return document.documentElement.textContent;
		},

		render() {
			const foundPhoton = this.props.isModuleFound( 'photon' ),
				foundLazyImages = this.props.isModuleFound( 'lazy-images' );

			if ( ! foundPhoton && ! foundLazyImages ) {
				return null;
			}

			const photon = this.props.module( 'photon' ),
				lazyImages = this.props.module( 'lazy-images' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Speed up your site' ) }
					hideButton>

					<SettingsGroup
						hasChild
						disableInDevMode
						module={ photon }>
						<ModuleToggle
							slug="photon"
							disabled={ this.props.isUnavailableInDevMode( 'photon' ) }
							activated={ this.props.getOptionValue( 'photon' ) }
							toggling={ this.props.isSavingAnyOption( 'photon' ) }
							toggleModule={ this.toggleModule }
						>
							<span className="jp-form-toggle-explanation">
								{ this.decodeEntities( photon.description ) }
							</span>
						</ModuleToggle>
						<FormFieldset>
							<span className="jp-form-setting-explanation">
								{ this.decodeEntities( photon.long_description ) }
							</span>
						</FormFieldset>
					</SettingsGroup>

					<SettingsGroup
						hasChild
						module={ lazyImages }>
						<ModuleToggle
							slug="lazy-images"
							disabled={ this.props.isUnavailableInDevMode( 'lazy-images' ) }
							activated={ this.props.getOptionValue( 'lazy-images' ) }
							toggling={ this.props.isSavingAnyOption( 'lazy-images' ) }
							toggleModule={ this.toggleModule }
						>
							<span className="jp-form-toggle-explanation">
								{ this.decodeEntities( lazyImages.description ) }
							</span>
						</ModuleToggle>
						<FormFieldset>
							<span className="jp-form-setting-explanation">
								{ this.decodeEntities( lazyImages.long_description ) }
							</span>
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name )
		};
	}
)( SpeedUpSite );
