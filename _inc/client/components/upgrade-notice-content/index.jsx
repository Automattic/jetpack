/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants/urls';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import analytics from 'lib/analytics';

const UpgradeNoticeContent = moduleSettingsForm(
	class extends Component {
		componentDidMount() {
			analytics.tracks.recordEvent(
				'jetpack_warm_welcome_view',
				{ version: this.props.version }
			);
		}

		trackLearnMoreClick = () => {
			analytics.tracks.recordJetpackClick( {
				target: 'warm_welcome_learn_more',
				version: this.props.version
			} );
		};

		dismissNotice = () => {
			analytics.tracks.recordJetpackClick( {
				target: 'warm_welcome_dismiss',
				version: this.props.version
			} );

			this.props.dismiss();
		};

		renderInnerContent() {
			return (
				<div className="jp-upgrade-notice__content">
					<p>
						{ __( 'The features you rely on, adapted for the new WordPress editor.' ) }<br />
						{ __( 'A new editor? Yes! Learn more.' ) }
					</p>

					<h2>
						{ __( 'Build your Jetpack site with blocks' ) }
					</h2>

					<p>
						{ __( 'Today, we are introducing the first wave of Jetpack-specific blocks built specifically ' +
							'for the new editor experience: payment buttons, contact forms, maps, and markdown.'
						) }
					</p>
					<p>
						<img
							src={ imagePath + 'block-picker.png' }
							width="250"
							alt={ __( 'Jetpack is ready for the new WordPress editor' ) } />
					</p>
					<div className="jp-dialogue__cta-container">
						<Button
							primary={ true }
							href="https://jetpack.com/support/site-accelerator/"
							onClick={ this.trackLearnMoreClick }
						>
							{ __( 'Learn more' ) }
						</Button>
						<Button onClick={ this.dismissNotice }>
							{ __( 'Okay, got it!' ) }
						</Button>
					</div>
				</div>
			);
		}

		render() {
			return (
				// TODO: update SVG?
				<JetpackDialogue
					svg={ <img src={ imagePath + 'jetpack-gutenberg.svg' } width="250" alt={ __( 'Jetpack is ready for the new WordPress editor' ) } /> }
					title={ __( 'New in Jetpack!' ) }
					content={ this.renderInnerContent() }
					dismiss={ this.dismissNotice }
				/>
			);
		}
	}
);

JetpackDialogue.propTypes = {
	dismiss: PropTypes.func,
	isUnavailableInDevMode: PropTypes.func,
	version: PropTypes.string,
};

export default UpgradeNoticeContent;
