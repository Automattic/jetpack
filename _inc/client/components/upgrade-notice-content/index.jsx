/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import analytics from 'lib/analytics';

const UpgradeNoticeContent = withModuleSettingsFormHelpers(
	class extends Component {
		componentDidMount() {
			analytics.tracks.recordEvent( 'jetpack_warm_welcome_view', { version: this.props.version } );
		}

		trackLearnMoreClick = () => {
			analytics.tracks.recordJetpackClick( {
				target: 'warm_welcome_view_editor',
				version: this.props.version,
			} );
		};

		dismissNotice = () => {
			analytics.tracks.recordJetpackClick( {
				target: 'warm_welcome_dismiss',
				version: this.props.version,
			} );

			this.props.dismiss();
		};

		renderInnerContent() {
			const content = JSON.parse( this.props.messageContent ).content;
			/*eslint-disable react/no-danger*/
			return (
				<div className="jp-upgrade-notice__content">
					<div dangerouslySetInnerHTML={ { __html: content } } />
					<div className="jp-dialogue__cta-container">
						<Button onClick={ this.dismissNotice }>{ __( 'Okay, got it!' ) }</Button>
					</div>
				</div>
			);
			/*eslint-enable react/no-danger*/
		}

		render() {
			if ( null !== this.props.messageContent ) {
				const post_image = JSON.parse( this.props.messageContent ).image;
				return (
					// TODO: update SVG?
					<JetpackDialogue
						svg={ <img src={ post_image } width="250" alt={ '' } /> }
						title={ __( 'New in Jetpack ' + this.props.version + '!' ) }
						content={ this.renderInnerContent() }
						dismiss={ this.dismissNotice }
					/>
				);
			}
		}
	}
);

JetpackDialogue.propTypes = {
	adminUrl: PropTypes.string,
	dismiss: PropTypes.func,
	isUnavailableInDevMode: PropTypes.func,
	version: PropTypes.string,
};

export default UpgradeNoticeContent;
