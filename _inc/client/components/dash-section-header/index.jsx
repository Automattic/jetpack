/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import Gridicon from 'components/gridicon';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';

export class DashSectionHeader extends React.Component {
	static displayName = 'DashSectionHeader';

	static propTypes = {
		label: PropTypes.string.isRequired,
		settingsPath: PropTypes.string,
		externalLinkPath: PropTypes.string,
		externalLink: PropTypes.string,
		externalLinkClick: PropTypes.func,
	};

	static defaultProps = {
		label: '',
		settingsPath: '',
		externalLinkPath: '',
		externalLink: ''
	};

	trackCogClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'settings-cog',
			group: 'security',
			page: 'aag'
		} );
	};

	render() {
		let settingsIcon;
		let externalLink;
		let children;

		const classes = classNames(
			this.props.className,
			'jp-dash-section-header'
		);

		if ( this.props.settingsPath ) {
			settingsIcon = (
				<a className="jp-dash-section-header__settings" href={ this.props.settingsPath }>
					<span className="screen-reader-text">
						{ __( 'Settings', { context: 'Noun. Displayed to screen readers.' } ) }
					</span>
					<Gridicon onClick={ this.trackCogClick } icon="cog" size={ 16 } />
				</a>
			);
		}

		if ( this.props.externalLink ) {
			externalLink = (
				<a
					className="jp-dash-section-header__external-link"
					href={ this.props.externalLinkPath }
					onClick={ this.props.externalLinkClick }
				>
						{ this.props.externalLink }
				</a>
			);
		}

		if ( this.props.children ) {
			children = (
				<div className="jp-dash-section-header__children" >
					{ this.props.children }
				</div>
			);
		}

		return (
			<div className={ classes }>
				<div className="jp-dash-section-header__label">
					<h2 className="jp-dash-section-header__name">
						{ this.props.label }
					</h2>
					{ settingsIcon }
				</div>
				{ externalLink }
				{ children }
			</div>
		);
	}
}

export default DashSectionHeader;
