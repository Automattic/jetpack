import { __, sprintf } from '@wordpress/i18n';
import ModernOverlay from 'components/jetpack-dialogue-modern';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import analytics from 'lib/analytics';
import React, { Component } from 'react';

const UpgradeNoticeContent = withModuleSettingsFormHelpers(
	class extends Component {
		componentDidMount() {
			jQuery( 'body' ).addClass( 'jp-dialogue-modern-showing' );
			analytics.tracks.recordEvent( 'jetpack_warm_welcome_view', { version: this.props.version } );
		}

		componentWillUnmount() {
			jQuery( 'body' ).removeClass( 'jp-dialogue-modern-showing' );
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
				</div>
			);
			/*eslint-enable react/no-danger*/
		}

		render() {
			const { featuredImage } = this.props;
			let featuredImageComponent = null,
				{ title } = this.props;

			if ( featuredImage && featuredImage.length > 0 ) {
				featuredImageComponent = <img src={ featuredImage } alt={ '' } />;
			}

			if ( ! title || 0 === title.length ) {
				title = sprintf(
					/* translators: Placeholder is a version number. */
					__( 'New in Jetpack %s', 'jetpack' ),
					this.props.version
				);
			}

			return (
				<ModernOverlay
					svg={ featuredImageComponent }
					title={ title }
					content={ this.renderInnerContent() }
					dismiss={ this.dismissNotice }
				/>
			);
		}
	}
);

export default UpgradeNoticeContent;
