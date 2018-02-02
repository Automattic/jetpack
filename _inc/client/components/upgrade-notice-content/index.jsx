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
			const lazyImages = this.props.module( 'lazy-images' );
			return (
				<div>
					<p>
						{ __( 'This release of Jetpack brings major new features and big improvements to your WordPress site.' ) }
					</p>

					<h2>
						{ __( 'Speed up your site and its content' ) }
					</h2>

					<p>
						{ __( 'Sites with large numbers of images can now activate the Lazy Loading Images feature, which significantly ' +
							"speeds up loading times for visitors. Instead of waiting for the entire page to load, " +
							'Jetpack will instead show pages instantly, and only download additional images when they are about to come into view.' ) }
					</p>

					<p>
						{ __( 'If this sounds like a great improvement (and it is) you can enable it now by clicking the toggle below.' ) }
					</p>

					<div className="jp-upgrade-notice__enable-module">

						<SettingsGroup
							hasChild
							disableInDevMode
							module={ lazyImages }>

							<ModuleToggle
								slug="lazy-images"
								disabled={ false }
								activated={ this.props.getOptionValue( 'lazy-images' ) }
								toggling={ this.props.isSavingAnyOption( 'lazy-images' ) }
								toggleModule={ this.toggleModule }
							>
								<span className="jp-form-toggle-explanation">
									{ decodeEntities( lazyImages.description ) }
								</span>
							</ModuleToggle>
						</SettingsGroup>
					</div>

					<p>
						{ __( 'We have also upgraded all our Premium plan customers to unlimited high-speed video storage ' +
							"(up from 13GB), and significantly reduced the CSS and JavaScript assets that Jetpack downloads " +
							'when using features like infinite scroll and embedding rich content.' ) }
					</p>

					<h2>
						{ __( 'Faster, more relevant search results' ) }
					</h2>

					<a href="https://wp.me/p1moTy-731" rel="noopener noreferrer" target="_blank">
						<img src="https://jetpackme.files.wordpress.com/2018/02/jetpack-elasticsearch-powered-search.png" width="700" alt={ __( 'Elasticsearch' ) } />
					</a>

					<p>
						{ __( 'Our faster site search is now available to all Professional' +
							" plan customers. This replaces the default WordPress search with an Elasticsearch-powered infrastructure that returns faster, more " +
							'relevant results to users.' ) }
					</p>

					<div className="jp-dialogue__cta-container">
						<Button
							primary={ true }
							href="https://jetpack.com/?p=27095"
						>
							{ __( 'Read the full announcement!' ) }
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
					svg={ <img src={ imagePath + 'jetpack-search.svg' } width="250" alt={ __( 'Jetpack Search' ) } /> }
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
