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
						{ __( 'A new editor? Yes! {{a}}Learn more{{/a}}.',
							components: {
								a: <ExternalLink
									target='_blank' rel='noopener noreferrer'
									href={'https://jetpack.com/2018/11/17/jetpack-6-8-gutenberg-and-jetpack-together-at-last/'}
								/>
							}
						) }
					</p>

					<h2>
						{ __( 'Build your Jetpack site with blocks' ) }
					</h2>

					<p>
						{ __( 'Today, we are introducing the first wave of Jetpack-specific blocks built specifically ' +
							'for the new editor experience: Simple Payment button, Contact form, Maps, and Markdown.'
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
							{ __( 'Take me to the new editor' ) }
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
