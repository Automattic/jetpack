/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

const SpeedUpSite = moduleSettingsForm(
	class extends Component {
		toggleModule = ( name, value ) => {
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
		};

		render() {
			const foundPhoton = this.props.isModuleFound( 'photon' );
			const foundLazyImages = this.props.isModuleFound( 'lazy-images' );

			if ( ! foundPhoton && ! foundLazyImages ) {
				return null;
			}

			const photon = this.props.module( 'photon' );
			const lazyImages = this.props.module( 'lazy-images' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Performance & speed' ) }
					hideButton>

					{ foundPhoton &&
						<SettingsGroup
							hasChild
							disableInDevMode
							module={ photon }
							support={ {
								link: 'https://jetpack.com/support/photon/',
							} }
							>
							<p>
								{ __(
									"Jetpack's global Content Delivery Network (CDN) optimizes " +
										'images so your visitors enjoy the fastest experience ' +
										'regardless of device or location. It also helps you ' +
										'save space on your hosting plan, since images are ' +
										'stored on our servers.'
								) }
							</p>
							<ModuleToggle
								slug="photon"
								disabled={ this.props.isUnavailableInDevMode( 'photon' ) }
								activated={ this.props.getOptionValue( 'photon' ) }
								toggling={ this.props.isSavingAnyOption( 'photon' ) }
								toggleModule={ this.toggleModule }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Serve images from our global CDN' ) }
								</span>
							</ModuleToggle>
						</SettingsGroup>
					}

					{ foundLazyImages &&
						<SettingsGroup
							hasChild
							module={ lazyImages }
							support={ {
								link: 'https://jetpack.com/support/lazy-images/',
							} }
							>
							<p>
								{ __(
									"Lazy-loading images improve your site's speed and create a " +
										'smoother viewing experience. Images will load as visitors ' +
										'scroll down the screen, instead of all at once.'
								) }
							</p>
							<ModuleToggle
								slug="lazy-images"
								disabled={ this.props.isUnavailableInDevMode( 'lazy-images' ) }
								activated={ this.props.getOptionValue( 'lazy-images' ) }
								toggling={ this.props.isSavingAnyOption( 'lazy-images' ) }
								toggleModule={ this.toggleModule }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Enable Lazy Loading for images' ) }
								</span>
							</ModuleToggle>
						</SettingsGroup>
					}
				</SettingsCard>
			);
		}
	}
);

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name )
		};
	}
)( SpeedUpSite );
