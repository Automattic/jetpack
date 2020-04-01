/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import analytics from 'lib/analytics';
import ExternalLink from 'components/external-link';
import ModernOverlay from 'components/jetpack-dialogue-modern';

const UpgradeNoticeContent = withModuleSettingsFormHelpers(
	class extends Component {
		componentDidMount() {
			jQuery( 'body' ).addClass( 'jp-dialogue-showing' );
			analytics.tracks.recordEvent( 'jetpack_warm_welcome_view', { version: this.props.version } );
		}

		componentWillUnmount() {
			jQuery( 'body' ).removeClass( 'jp-dialogue-showing' );
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
			const domparser = new DOMParser();
			const dom_content = domparser.parseFromString( this.props.releasePostContent, 'text/html' );
			const els = dom_content.getElementsByTagName( 'a' );
			for ( let i = 0; i < els.length; i++ ) {
				els[ i ].setAttribute( 'target', '_blank' );
				els[ i ].setAttribute( 'rel', 'noopener noreferrer' );
			}
			const content = dom_content.body.innerHTML;

			/*eslint-disable react/no-danger*/
			return (
				<div className="jp-upgrade-notice__content">
					{ /*
					 * The release post content is santized before reaching this point.
					 * See Jetpack::send_update_modal_data().
					 */ }
					<div dangerouslySetInnerHTML={ { __html: content } } />
					<div className="jp-dialogue-modern__cta-container">
						<Button onClick={ this.dismissNotice }>{ __( 'Okay, got it!' ) }</Button>
						<br />
						<ExternalLink
							href="https://wordpress.org/plugins/jetpack/#developers"
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'View the Jetpack %(version)s changelog', {
								args: {
									version: this.props.version,
								},
								comment: '%(version) is a version number.',
							} ) }
						</ExternalLink>
					</div>
				</div>
			);
			/*eslint-enable react/no-danger*/
		}

		render() {
			const { featuredImage } = this.props;
			let featuredImageComponent = null;

			if ( featuredImage && featuredImage.length > 0 ) {
				featuredImageComponent = <img src={ featuredImage } alt={ '' } />;
			}

			return (
				<ModernOverlay
					svg={ featuredImageComponent }
					title={ __( 'New in Jetpack %(version)s', {
						args: {
							version: this.props.version,
						},
						comment: '%(version) is a version number.',
					} ) }
					content={ this.renderInnerContent() }
					dismiss={ this.dismissNotice }
				/>
			);
		}
	}
);

export default UpgradeNoticeContent;
