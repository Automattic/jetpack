/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants/urls';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { FormFieldset } from 'components/forms';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { ModuleToggle } from 'components/module-toggle';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';

const UpgradeNoticeContent = moduleSettingsForm(
	class extends Component {
		toggleModule = ( name, value ) => {
			this.props.updateOptions( { [ name ]: ! value } );
		};

		handleSiteAcceleratorChange = () => {
			// Initial status for both modules.
			let newPhotonStatus = this.props.getOptionValue( 'photon' );
			let newAssetCdnStatus = this.props.getOptionValue( 'photon-cdn' );

			// Check if any of the CDN options are on.
			const siteAcceleratorStatus = newPhotonStatus || newAssetCdnStatus;

			// Are the modules available?
			const photonStatus = this.props.getModuleOverride( 'photon' );
			const assetCdnStatus = this.props.getModuleOverride( 'photon-cdn' );

			// If one of them is on, we turn everything off, including Tiled Galleries that depend on Photon.
			if ( true === siteAcceleratorStatus ) {
				if ( false === ! newPhotonStatus && 'active' !== photonStatus ) {
					newPhotonStatus = false;

					this.props.updateOptions( {
						photon: false,
						'tiled-gallery': false,
						tiled_galleries: false
					} );
				}
				if ( false === ! newAssetCdnStatus && 'active' !== assetCdnStatus ) {
					newAssetCdnStatus = false;

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
				if ( false === newAssetCdnStatus && 'inactive' !== assetCdnStatus ) {
					newAssetCdnStatus = true;

					this.props.updateOptions( {
						'photon-cdn': true
					} );
				}
			}

			// If at least one of the modules is now on, let's reflect that with the status of our main toggle.
			if ( true === newPhotonStatus || true === newAssetCdnStatus ) {
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
			if ( this.props.getOptionValue( 'photon-cdn' ) !== newAssetCdnStatus ) {
				analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
					module: 'photon-cdn',
					toggled: ( false === newAssetCdnStatus ) ? 'off' : 'on'
				} );
			}
		};

		renderInnerContent() {
			const foundPhoton = this.props.isModuleFound( 'photon' );
			const foundAssetCdn = this.props.isModuleFound( 'photon-cdn' );

			// Check if any of the CDN options are on.
			const siteAcceleratorStatus = this.props.getOptionValue( 'photon' ) || this.props.getOptionValue( 'photon-cdn' );

			// Is at least one of the 2 modules available (not hidden via a module override)?
			const photonStatus = this.props.getModuleOverride( 'photon' );
			const assetCdnStatus = this.props.getModuleOverride( 'photon-cdn' );
			const canDisplaySiteAcceleratorSettings = ( foundPhoton && foundAssetCdn ) && ( 'inactive' !== photonStatus || 'inactive' !== assetCdnStatus );

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
				<div className="jp-upgrade-notice__content">
					<p>
						{ __( 'This release of Jetpack brings with it a major new free feature!' ) }
					</p>

					<h2>
						{ __( 'Speed up your site and its content' ) }
					</h2>

					<p>
						{ __( 'Jetpack 6.7 introduces a new feature to help make your site faster. Our site accelerator already ' +
							'offered speedier and optimized images served from our global Content Delivery Network. ' +
							'Now we can also speed up your site by serving your static files (think CSS and JavaScript) from the same network.'
						) }
					</p>

					<p>
						{ __( 'Turn on one or both and see decreased page load speeds, ' +
						'as well as reduced bandwidth usage—which may lead to lower hosting costs.'
						) }
					</p>

					<p>
						{ __( 'Enable site acceleration now by clicking the toggle below.' ) }
					</p>

					<div className="jp-upgrade-notice__enable-module">

						<SettingsGroup hasChild>
							<CompactFormToggle
								checked={ siteAcceleratorStatus }
								toggling={ togglingSiteAccelerator }
								onChange={ this.handleSiteAcceleratorChange }
								disabled={ ! canDisplaySiteAcceleratorSettings }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Enable site accelerator' ) }
								</span>
							</CompactFormToggle>
							<FormFieldset>
								<ModuleToggle
									slug="photon"
									disabled={ this.props.isUnavailableInDevMode( 'photon' ) }
									activated={ this.props.getOptionValue( 'photon' ) }
									toggling={ this.props.isSavingAnyOption( 'photon' ) }
									toggleModule={ this.toggleModule }
								>
									<span className="jp-form-toggle-explanation">
										{ __( 'Speed up image load times' ) }
									</span>
								</ModuleToggle>
								<ModuleToggle
									slug="photon-cdn"
									disabled={ false }
									activated={ this.props.getOptionValue( 'photon-cdn' ) }
									toggling={ this.props.isSavingAnyOption( 'photon-cdn' ) }
									toggleModule={ this.toggleModule }
								>
									<span className="jp-form-toggle-explanation">
										{ __( 'Speed up static file load times' ) }
									</span>
								</ModuleToggle>
							</FormFieldset>
						</SettingsGroup>
					</div>

					<div className="jp-dialogue__cta-container">
						<Button
							primary={ true }
							href="https://jetpack.com/support/site-accelerator/"
						>
							{ __( 'Learn more' ) }
						</Button>
					</div>
				</div>
			);
		}

		render() {
			return (
				<JetpackDialogue
					svg={ <img src={ imagePath + 'jetpack-performance.svg' } width="250" alt={ __( "Jetpack's site accelerator" ) } /> }
					title={ __( 'New in Jetpack!' ) }
					content={ this.renderInnerContent() }
					dismiss={ this.props.dismiss }
				/>
			);
		}
	}
);

JetpackDialogue.propTypes = {
	dismiss: PropTypes.func,
	isUnavailableInDevMode: PropTypes.func,
};

export default connect(
	( state ) => {
		return {
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name ),
			module: ( module_name ) => getModule( state, module_name ),
			getModuleOverride: ( module_name ) => getModuleOverride( state, module_name ),
		};
	}
)( UpgradeNoticeContent );
