/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import ExternalLink from 'components/external-link';

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
				target: 'warm_welcome_view_editor',
				version: this.props.version
			} );
		};

		trackUpdateClick = () => {
			analytics.tracks.recordJetpackClick( {
				target: 'warm_welcome_update_wordpress',
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

		renderLearnMore = () => {
			const { isGutenbergAvailable } = this.props;
			const blockEditorUrl = `${ this.props.adminUrl }post-new.php`;
			const updateUrl = `${ this.props.adminUrl }update-core.php`;

			if ( isGutenbergAvailable ) {
				return (
					<Button
						primary={ true }
						href={ blockEditorUrl }
						onClick={ this.trackLearnMoreClick }
					>
						{ __( 'Take me to the new editor' ) }
					</Button>
				);
			}
			return (
				<Button
					primary={ true }
					href={ updateUrl }
					onClick={ this.trackUpdateClick }
				>
					{ __( 'Update to get the new editor' ) }
				</Button>
			);
		};

		renderInnerContent() {
			return (
				<div className="jp-upgrade-notice__content">
					<p>
						{ __( 'The features you rely on, adapted for the new WordPress editor.' ) }<br />
						{
							__( 'A new editor? Yes! {{a}}Learn more{{/a}}.', {
								components: {
									a: <ExternalLink
										target="_blank" rel="noopener noreferrer"
										href={ 'https://wp.me/p1moTy-cee' }
									/>
								}
							} )
						}
					</p>

					<h2>
						{ __( 'Build your Jetpack site with blocks' ) }
					</h2>

					<p>
						{ __( 'Today, we are introducing the first wave of Jetpack-specific blocks built specifically ' +
							'for the new editor experience: Simple Payment button, Form, Map, and Markdown.'
						) }
					</p>
					<p>
						<img
							src={ imagePath + 'block-picker.png' }
							width="250"
							alt={ __( 'Jetpack is ready for the new WordPress editor' ) } />
					</p>
					<div className="jp-dialogue__cta-container">
						{ this.renderLearnMore() }
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
	adminUrl: PropTypes.string,
	dismiss: PropTypes.func,
	isUnavailableInDevMode: PropTypes.func,
	version: PropTypes.string,
	isGutenbergAvailable: PropTypes.bool,
};

export default UpgradeNoticeContent;
