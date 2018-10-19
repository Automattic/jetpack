/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { FormFieldset } from 'components/forms';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';
import analytics from 'lib/analytics';

const SpeedUpSite = moduleSettingsForm(
	class extends Component {
		toggleModule = ( name, value ) => {
			if ( 'photon' === name ) {
				// Tiled Galleries depends on Photon. Deactivate it if Photon is deactivated.
				if ( false === ! value ) {
					this.props.updateOptions( { photon: false, 'tiled-gallery': false, tiled_galleries: false } );
				} else {
					this.props.updateOptions( { photon: true, 'tiled-gallery': true, tiled_galleries: true } );
				}
			} else {
				this.props.updateOptions( { [ name ]: ! value } );
			}
		};

		handleCdnChange = () => {
			// Initial status for both modules.
			let newPhotonStatus = this.props.getOptionValue( 'photon' );
			let newPhotonCdnStatus = this.props.getOptionValue( 'photon-cdn' );

			// Check if any of the CDN options are on.
			const CdnStatus = newPhotonStatus || newPhotonCdnStatus;

			// Are the modules available?
			const photonStatus = this.props.getModuleOverride( 'photon' );
			const photonCdnStatus = this.props.getModuleOverride( 'photon-cdn' );

			// If one of them is on, we turn everything off, including Tiled Galleries that depend on Photon.
			if ( true === CdnStatus ) {
				if ( false === ! newPhotonStatus && 'active' !== photonStatus ) {
					newPhotonStatus = false;

					this.props.updateOptions( {
						photon: false,
						'tiled-gallery': false,
						tiled_galleries: false
					} );
				}
				if ( false === ! newPhotonCdnStatus && 'active' !== photonCdnStatus ) {
					newPhotonCdnStatus = false;

					this.props.updateOptions( {
						'photon-cdn': false
					} );
				}
			} else {
				if ( false === newPhotonStatus && 'inactive' !== photonStatus ) {
					newPhotonStatus = true;

					this.props.updateOptions( {
						photon: true,
						'tiled-gallery': true,
						tiled_galleries: true
					} );
				}
				if ( false === newPhotonCdnStatus && 'inactive' !== photonCdnStatus ) {
					newPhotonCdnStatus = true;

					this.props.updateOptions( {
						'photon-cdn': true
					} );
				}
			}

			// If at least one of the modules is now on, let's reflect that with the status of our main toggle.
			if ( true === newPhotonStatus || true === newPhotonCdnStatus ) {
				// Track the main toggle switch.
				analytics.tracks.recordJetpackClick( {
					target: 'jetpack_site_accelerator_toggle',
					toggled: 'on'
				} );
			} else {
				analytics.tracks.recordJetpackClick( {
					target: 'jetpack_site_accelerator_toggle',
					toggled: 'off'
				} );
			}

			// Track any potential Photon toggle switch.
			if ( this.props.getOptionValue( 'photon' ) !== newPhotonStatus ) {
				analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
					module: 'photon',
					toggled: ( false === newPhotonStatus ) ? 'off' : 'on'
				} );
			}

			// Track any potential Photon CDN toggle switch.
			if ( this.props.getOptionValue( 'photon-cdn' ) !== newPhotonCdnStatus ) {
				analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
					module: 'photon-cdn',
					toggled: ( false === newPhotonCdnStatus ) ? 'off' : 'on'
				} );
			}
		};

		render() {
			const foundPhoton = this.props.isModuleFound( 'photon' );
			const foundPhotonCdn = this.props.isModuleFound( 'photon-cdn' );
			const foundLazyImages = this.props.isModuleFound( 'lazy-images' );

			if ( ! foundPhoton && ! foundLazyImages && ! foundPhotonCdn ) {
				return null;
			}

			const lazyImages = this.props.module( 'lazy-images' );

			// Check if any of the CDN options are on.
			const CdnStatus = this.props.getOptionValue( 'photon' ) || this.props.getOptionValue( 'photon-cdn' );

			// Is at least one of the 2 modules available (not hidden via a module override)?
			const photonStatus = this.props.getModuleOverride( 'photon' );
			const photonCdnStatus = this.props.getModuleOverride( 'photon-cdn' );
			const canDisplayCdnSettings = ( foundPhoton && foundPhotonCdn ) && ( 'inactive' !== photonStatus || 'inactive' !== photonCdnStatus );

			// Display the main toggle in main search results as long as one of the modules is not hidden.
			const canAppearInSearch = ( foundPhoton || foundPhotonCdn ) && ( 'inactive' !== photonStatus || 'inactive' !== photonCdnStatus );

			// Monitor any changes that should cause our main toggle to appear toggling.
			let togglingSiteAccelerator;
			// First Photon activating.
			if ( ! this.props.getOptionValue( 'photon' ) && this.props.isSavingAnyOption( 'photon' ) ) {
				if ( this.props.getOptionValue( 'photon-cdn' ) ) {
					togglingSiteAccelerator = false;
				} else {
					togglingSiteAccelerator = true;
				}
			// Then Asset CDN activating.
			} else if ( ! this.props.getOptionValue( 'photon-cdn' ) && this.props.isSavingAnyOption( 'photon-cdn' ) ) {
				if ( this.props.getOptionValue( 'photon' ) ) {
					togglingSiteAccelerator = false;
				} else {
					togglingSiteAccelerator = true;
				}
			// Then Photon deactivating.
			} else if ( this.props.getOptionValue( 'photon' ) && this.props.isSavingAnyOption( 'photon' ) ) {
				if ( this.props.getOptionValue( 'photon-cdn' ) ) {
					togglingSiteAccelerator = false;
				} else {
					togglingSiteAccelerator = true;
				}

				// Is the Asset CDN being disabled as well?
				if ( this.props.getOptionValue( 'photon-cdn' ) && this.props.isSavingAnyOption( 'photon-cdn' ) ) {
					togglingSiteAccelerator = true;
				}
			// Then Asset CDN deactivating.
			} else if ( this.props.getOptionValue( 'photon-cdn' ) && this.props.isSavingAnyOption( 'photon-cdn' ) ) {
				if ( this.props.getOptionValue( 'photon' ) ) {
					togglingSiteAccelerator = false;
				} else {
					togglingSiteAccelerator = true;
				}
			} else {
				togglingSiteAccelerator = false;
			}

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Performance & speed' ) }
					hideButton>

					{ ( foundPhoton || foundPhotonCdn ) &&
						<SettingsGroup
							hasChild
							support={ {
								link: 'https://jetpack.com/support/image-cdn/',
							} }
							>
							<p>
								{ __(
									"Jetpack's global Content Delivery Network (CDN) optimizes " +
										'files and images so your visitors enjoy ' +
										'the fastest experience regardless of device or location.'
								) }
							</p>
							{ canAppearInSearch &&
								<CompactFormToggle
									checked={ CdnStatus }
									toggling={ togglingSiteAccelerator }
									onChange={ this.handleCdnChange }
									disabled={ ! canDisplayCdnSettings }
								>
									<span className="jp-form-toggle-explanation">
										{ __( 'Enable site accelerator' ) }
									</span>
								</CompactFormToggle>
							}
							<FormFieldset>
								{ foundPhoton &&
									<ModuleToggle
										slug="photon"
										disabled={ this.props.isUnavailableInDevMode( 'photon' ) }
										activated={ this.props.getOptionValue( 'photon' ) }
										toggling={ this.props.isSavingAnyOption( 'photon' ) }
										toggleModule={ this.toggleModule }
									>
										<span className="jp-form-toggle-explanation">
											{ __( 'Speed up images' ) }
										</span>
									</ModuleToggle>
								}
								{ foundPhotonCdn &&
									<ModuleToggle
										slug="photon-cdn"
										activated={ this.props.getOptionValue( 'photon-cdn' ) }
										toggling={ this.props.isSavingAnyOption( 'photon-cdn' ) }
										toggleModule={ this.toggleModule }
									>
										<span className="jp-form-toggle-explanation">
											{ __( 'Speed up all static files (CSS and JavaScript) for WordPress, WooCommerce, and Jetpack' ) }
										</span>
									</ModuleToggle>
								}
							</FormFieldset>
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
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name ),
			getModuleOverride: ( module_name ) => getModuleOverride( state, module_name )
		};
	}
)( SpeedUpSite );
