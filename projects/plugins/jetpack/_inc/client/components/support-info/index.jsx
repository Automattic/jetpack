import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { WpcomSupportLink } from '@automattic/jetpack-shared-extension-utils/components/wpcom-support-link';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { Component } from 'react';
import InfoPopover from 'components/info-popover';
import analytics from 'lib/analytics';

import './style.scss';

export default class SupportInfo extends Component {
	static propTypes = {
		module: PropTypes.object,
		text: PropTypes.string,
		link: PropTypes.string,
		privacyLink: PropTypes.string,
		// On WordPress.com (Simple/Atomic) sites, prefer this wordpress.com/support
		// URL and open it inside the Help Center instead of jetpack.com in a new
		// tab. See DOTCOM-17147.
		wpcomLink: PropTypes.string,
		wpcomPostId: PropTypes.number,
	};

	static defaultProps = {
		module: undefined,
		text: '',
		link: '',
		privacyLink: '',
		wpcomLink: '',
		wpcomPostId: undefined,
	};

	constructor() {
		super( ...arguments );

		this.getModule = this.getModule.bind( this );
		this.trackInfoClick = this.trackInfoClick.bind( this );
		this.trackLearnMoreClick = this.trackLearnMoreClick.bind( this );
		this.trackPrivacyInfoClick = this.trackPrivacyInfoClick.bind( this );
	}

	getModule() {
		return this.props.module || {};
	}

	trackInfoClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'info-icon',
			feature: this.getModule().module,
		} );
	}

	trackLearnMoreClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'learn-more',
			feature: this.getModule().module,
		} );
	}

	trackPrivacyInfoClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'privacy-info',
			feature: this.getModule().module,
		} );
	}

	render() {
		const { text, link, wpcomLink, wpcomPostId } = this.props;
		let { privacyLink } = this.props;

		// On WordPress.com (Simple/Atomic) sites with a wpcomLink, surface the Dotcom
		// support doc and open it in the Help Center instead of the Jetpack support
		// and privacy links. See DOTCOM-17147.
		const isWpcom = isWpcomPlatformSite();
		const useWpcomSupport = isWpcom && !! wpcomLink;

		if ( ! privacyLink && link ) {
			privacyLink = link + '#privacy';
		}

		return (
			<div className="jp-support-info">
				<InfoPopover
					position="left"
					onClick={ this.trackInfoClick }
					screenReaderText={ __( 'Learn more', 'jetpack' ) }
				>
					{ text + ' ' }
					{ ( link || useWpcomSupport ) && (
						<div className="jp-support-info__learn-more">
							{ useWpcomSupport ? (
								<WpcomSupportLink
									supportLink={ wpcomLink }
									supportPostId={ wpcomPostId }
									onClick={ this.trackLearnMoreClick }
								>
									{ __( 'Learn more', 'jetpack' ) }
								</WpcomSupportLink>
							) : (
								<Link
									openInNewTab
									href={ link }
									onClick={ this.trackLearnMoreClick }
									rel="noopener noreferrer"
								>
									{ __( 'Learn more', 'jetpack' ) }
								</Link>
							) }
						</div>
					) }
					{ ! useWpcomSupport && (
						<span className="jp-support-info__privacy">
							<Link
								openInNewTab
								href={ privacyLink }
								onClick={ this.trackPrivacyInfoClick }
								rel="noopener noreferrer"
							>
								{ __( 'Privacy information', 'jetpack' ) }
							</Link>
						</span>
					) }
				</InfoPopover>
			</div>
		);
	}
}
