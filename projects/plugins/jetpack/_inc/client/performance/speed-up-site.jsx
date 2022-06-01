import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode } from 'state/connection';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';

const SpeedUpSite = withModuleSettingsFormHelpers(
	class extends Component {
		toggleModule = ( name, value ) => {
			if ( 'photon' === name ) {
				// Tiled Galleries depends on Photon. Deactivate it if Photon is deactivated.
				if ( false === ! value ) {
					this.props.updateOptions( {
						photon: false,
						'tiled-gallery': false,
						tiled_galleries: false,
					} );
				} else {
					this.props.updateOptions( {
						photon: true,
						'tiled-gallery': true,
						tiled_galleries: true,
					} );
				}
			} else {
				this.props.updateOptions( { [ name ]: ! value } );
			}
		};

		handleSiteAcceleratorChange = () => {
			// Initial status for both modules.
			let newPhotonStatus = this.props.getOptionValue( 'photon' );
			let newAssetCdnStatus = this.props.getOptionValue( 'photon-cdn' );

			// Check if any of the CDN options are on.
			const siteAcceleratorStatus = newPhotonStatus || newAssetCdnStatus;

			// Are the modules available?
			const assetCdnStatus = this.props.getModuleOverride( 'photon-cdn' );
			let photonStatus = this.props.getModuleOverride( 'photon' );
			// Force Photon to be inactive if we are not in offline mode.
			if ( this.props.isOfflineMode ) {
				photonStatus = 'inactive';
			}

			// If one of them is on, we turn everything off, including Tiled Galleries that depend on Photon.
			if ( true === siteAcceleratorStatus ) {
				const messages = {
					progress: __( 'Disabling site accelerator…', 'jetpack' ),
					success: __( 'Site accelerator is no longer speeding up your site!', 'jetpack' ),
					error: error =>
						sprintf(
							/* translators: placeholder is an error code. */
							__( 'Error disabling site accelerator. %s', 'jetpack' ),
							error
						),
				};
				let settings = {};

				if ( false === ! newPhotonStatus && 'active' !== photonStatus ) {
					newPhotonStatus = false;
					settings = {
						photon: false,
						'tiled-gallery': false,
						tiled_galleries: false,
					};
				}
				if ( false === ! newAssetCdnStatus && 'active' !== assetCdnStatus ) {
					newAssetCdnStatus = false;
					settings = {
						...settings,
						'photon-cdn': false,
					};
				}
				this.props.updateOptions( settings, messages );
			} else {
				const messages = {
					progress: __( 'Enabling Site accelerator…', 'jetpack' ),
					success: __( 'Site accelerator is now speeding up your site!', 'jetpack' ),
					error: error =>
						sprintf(
							/* translators: placeholder is an error code. */
							__( 'Error enabling Site accelerator. %s', 'jetpack' ),
							error
						),
				};
				let settings = {};

				if ( false === newPhotonStatus && 'inactive' !== photonStatus ) {
					newPhotonStatus = true;

					settings = {
						photon: true,
						'tiled-gallery': true,
						tiled_galleries: true,
					};
				}
				if ( false === newAssetCdnStatus && 'inactive' !== assetCdnStatus ) {
					newAssetCdnStatus = true;
					settings = {
						...settings,
						'photon-cdn': true,
					};
				}
				this.props.updateOptions( settings, messages );
			}

			// If at least one of the modules is now on, let's reflect that with the status of our main toggle.
			if ( true === newPhotonStatus || true === newAssetCdnStatus ) {
				// Track the main toggle switch.
				analytics.tracks.recordJetpackClick( {
					target: 'jetpack_site_accelerator_toggle',
					toggled: 'on',
				} );
			} else {
				analytics.tracks.recordJetpackClick( {
					target: 'jetpack_site_accelerator_toggle',
					toggled: 'off',
				} );
			}

			// Track any potential Photon toggle switch.
			if ( this.props.getOptionValue( 'photon' ) !== newPhotonStatus ) {
				analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
					module: 'photon',
					toggled: false === newPhotonStatus ? 'off' : 'on',
				} );
			}

			// Track any potential Photon CDN toggle switch.
			if ( this.props.getOptionValue( 'photon-cdn' ) !== newAssetCdnStatus ) {
				analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
					module: 'photon-cdn',
					toggled: false === newAssetCdnStatus ? 'off' : 'on',
				} );
			}
		};

		render() {
			const foundPhoton = this.props.isModuleFound( 'photon' );
			const foundAssetCdn = this.props.isModuleFound( 'photon-cdn' );
			const foundLazyImages = this.props.isModuleFound( 'lazy-images' );

			if ( ! foundPhoton && ! foundLazyImages && ! foundAssetCdn ) {
				return null;
			}

			const lazyImages = this.props.module( 'lazy-images' );

			// Check if any of the CDN options are on.
			const siteAcceleratorStatus =
				this.props.getOptionValue( 'photon' ) || this.props.getOptionValue( 'photon-cdn' );

			// Is at least one of the 2 modules available (not hidden via a module override, or unavailable because of offline mode)?
			const assetCdnStatus = this.props.getModuleOverride( 'photon-cdn' );
			let photonStatus = this.props.getModuleOverride( 'photon' );
			// Force Photon to be inactive if we are not in offline mode.
			if ( this.props.isOfflineMode ) {
				photonStatus = 'inactive';
			}

			const canDisplaySiteAcceleratorSettings =
				foundPhoton &&
				foundAssetCdn &&
				( 'inactive' !== photonStatus || 'inactive' !== assetCdnStatus );

			// Display the main toggle in main search results as long as one of the modules is not hidden.
			const canAppearInSearch =
				( foundPhoton || foundAssetCdn ) &&
				( 'inactive' !== photonStatus || 'inactive' !== assetCdnStatus );

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
			} else if (
				! this.props.getOptionValue( 'photon-cdn' ) &&
				this.props.isSavingAnyOption( 'photon-cdn' )
			) {
				if ( this.props.getOptionValue( 'photon' ) ) {
					togglingSiteAccelerator = false;
				} else {
					togglingSiteAccelerator = true;
				}
				// Then Photon deactivating.
			} else if (
				this.props.getOptionValue( 'photon' ) &&
				this.props.isSavingAnyOption( 'photon' )
			) {
				if ( this.props.getOptionValue( 'photon-cdn' ) ) {
					togglingSiteAccelerator = false;
				} else {
					togglingSiteAccelerator = true;
				}

				// Is the Asset CDN being disabled as well?
				if (
					this.props.getOptionValue( 'photon-cdn' ) &&
					this.props.isSavingAnyOption( 'photon-cdn' )
				) {
					togglingSiteAccelerator = true;
				}
				// Then Asset CDN deactivating.
			} else if (
				this.props.getOptionValue( 'photon-cdn' ) &&
				this.props.isSavingAnyOption( 'photon-cdn' )
			) {
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
					header={ __( 'Performance & speed', 'jetpack' ) }
					hideButton
					module="performance-speed"
				>
					{ ( foundPhoton || foundAssetCdn ) && (
						<SettingsGroup
							hasChild
							support={ {
								link: getRedirectUrl( 'jetpack-support-site-accelerator' ),
							} }
						>
							<p>
								{ __(
									'Load pages faster by allowing Jetpack to optimize your images and serve your images and static files (like CSS and JavaScript) from our global network of servers.',
									'jetpack'
								) }
							</p>
							{ canAppearInSearch && (
								<CompactFormToggle
									checked={ siteAcceleratorStatus }
									toggling={ togglingSiteAccelerator }
									onChange={ this.handleSiteAcceleratorChange }
									disabled={ ! canDisplaySiteAcceleratorSettings }
								>
									<span className="jp-form-toggle-explanation">
										{ __( 'Enable site accelerator', 'jetpack' ) }
									</span>
								</CompactFormToggle>
							) }
							<FormFieldset>
								{ foundPhoton && (
									<ModuleToggle
										slug="photon"
										disabled={ this.props.isUnavailableInOfflineMode( 'photon' ) }
										activated={ this.props.getOptionValue( 'photon' ) }
										toggling={ this.props.isSavingAnyOption( 'photon' ) }
										toggleModule={ this.toggleModule }
									>
										<span className="jp-form-toggle-explanation">
											{ __( 'Speed up image load times', 'jetpack' ) }
										</span>
									</ModuleToggle>
								) }
								{ foundAssetCdn && (
									<ModuleToggle
										slug="photon-cdn"
										activated={ this.props.getOptionValue( 'photon-cdn' ) }
										toggling={ this.props.isSavingAnyOption( 'photon-cdn' ) }
										toggleModule={ this.toggleModule }
									>
										<span className="jp-form-toggle-explanation">
											{ __( 'Speed up static file load times', 'jetpack' ) }
										</span>
									</ModuleToggle>
								) }
							</FormFieldset>
						</SettingsGroup>
					) }

					{ foundLazyImages && (
						<SettingsGroup
							hasChild
							module={ lazyImages }
							support={ {
								link: getRedirectUrl( 'jetpack-support-lazy-images' ),
							} }
						>
							<p>
								{ __(
									'Lazy-loading images will improve your site’s speed and create a smoother viewing experience. Images will load as visitors scroll down the screen, instead of all at once.',
									'jetpack'
								) }
							</p>
							<ModuleToggle
								slug="lazy-images"
								disabled={ this.props.isUnavailableInOfflineMode( 'lazy-images' ) }
								activated={ this.props.getOptionValue( 'lazy-images' ) }
								toggling={ this.props.isSavingAnyOption( 'lazy-images' ) }
								toggleModule={ this.toggleModule }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Enable Lazy Loading for images', 'jetpack' ) }
								</span>
							</ModuleToggle>
						</SettingsGroup>
					) }
				</SettingsCard>
			);
		}
	}
);

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
		isOfflineMode: isOfflineMode( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	};
} )( SpeedUpSite );
