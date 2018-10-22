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
import decodeEntities from 'lib/decode-entities';
import { imagePath } from 'constants/urls';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { getModule } from 'state/modules';
import { ModuleToggle } from 'components/module-toggle';
import SettingsGroup from 'components/settings-group';
const UpgradeNoticeContent = moduleSettingsForm(
	class extends Component {
		toggleModule = ( name, value ) => {
			this.props.updateOptions( { [ name ]: ! value } );
		};

		renderInnerContent() {
			const assetCdn = this.props.module( 'photon-cdn' );
			return (
				<div>
					<p>
						{ __( 'This release of Jetpack brings major new features and big improvements to your WordPress site.' ) }
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

						<SettingsGroup
							hasChild
							module={ assetCdn }>

							<ModuleToggle
								slug="photon-cdn"
								disabled={ false }
								activated={ this.props.getOptionValue( 'photon-cdn' ) }
								toggling={ this.props.isSavingAnyOption( 'photon-cdn' ) }
								toggleModule={ this.toggleModule }
							>
								<span className="jp-form-toggle-explanation">
									{ decodeEntities( assetCdn.description ) }
								</span>
							</ModuleToggle>
						</SettingsGroup>
					</div>

					<div className="jp-dialogue__cta-container">
						<Button
							primary={ true }
							href="https://wp.me/p1moTy-aEq"
						>
							{ __( 'Read the announcement' ) }
						</Button>

						<p className="jp-dialogue__note">
							<a href="https://jetpack.com/pricing">{ __( 'Compare paid plans' ) }</a>
						</p>
					</div>
				</div>
			);
		}

		render() {
			return (
				<JetpackDialogue
					svg={ <img src={ imagePath + 'jetpack-performance.svg' } width="250" alt={ __( "Jetpack's site accelerator" ) } /> }
					title={ __( 'Major new features from Jetpack' ) }
					content={ this.renderInnerContent() }
					dismiss={ this.props.dismiss }
				/>
			);
		}
	}
);

JetpackDialogue.propTypes = {
	dismiss: PropTypes.func
};

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
		};
	}
)( UpgradeNoticeContent );
