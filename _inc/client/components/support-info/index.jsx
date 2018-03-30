/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import InfoPopover from 'components/info-popover';
import ExternalLink from 'components/external-link';

require( './style.scss' );

export default class SupportInfo extends Component {
	static propTypes = {
		module: PropTypes.object,
		text: PropTypes.string,
		link: PropTypes.string,
		privacyLink: PropTypes.string,
	};

	static defaultProps = {
		module: undefined,
		text: '',
		link: '',
		privacyLink: '',
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
			feature: this.getModule().module
		} );
	}

	trackLearnMoreClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'learn-more',
			feature: this.getModule().module
		} );
	}

	trackPrivacyInfoClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'privacy-info',
			feature: this.getModule().module
		} );
	}

	render() {
		const module = this.getModule();
		let { text, link, privacyLink } = this.props;

		text = text || module.long_description || '';
		link = link || module.learn_more_button || '';

		if ( ! privacyLink && link ) {
			privacyLink = link + '#privacy';
		}

		return (
			<div className="jp-support-info">
				<InfoPopover
					position="left"
					onClick={ this.trackInfoClick }
					screenReaderText={ __( 'Learn more' ) }
				>
					{ text + ' ' }
					<span className="jp-support-info__learn-more">
						<ExternalLink
							href={ link }
							onClick={ this.trackLearnMoreClick }
							target="_blank" rel="noopener noreferrer"
						>
							{ __( 'Learn more' ) }
						</ExternalLink>
					</span>
					<span className="jp-support-info__privacy">
						<ExternalLink
							href={ privacyLink }
							onClick={ this.trackPrivacyInfoClick }
							target="_blank" rel="noopener noreferrer"
						>
							{ __( 'Privacy Information' ) }
						</ExternalLink>
					</span>
				</InfoPopover>
			</div>
		);
	}
}
