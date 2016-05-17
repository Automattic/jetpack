/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
import Gridicon from 'components/gridicon';

export default React.createClass( {
	displayName: 'DashSectionHeader',

	propTypes: {
		label: React.PropTypes.string.isRequired,
		settingsPath: React.PropTypes.string,
		externalLinkPath: React.PropTypes.string,
		externalLink: React.PropTypes.string
	},

	getDefaultProps() {
		return {
			label: '',
			settingsPath: '',
			externalLinkPath: '',
			externalLink: ''
		};
	},

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
					<span className="screen-reader-text">Settings</span>
					<Gridicon icon="cog" size={ 16 } />
				</a>
			);
		}

		if ( this.props.externalLink ) {
			externalLink = (
				<a
					className="jp-dash-section-header__external-link"
					href={ this.props.externalLinkPath }>
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
					<h2 className="jp-dash-section-header__label">
						{ this.props.label }
					</h2>
					{ settingsIcon }
				</div>
				{ externalLink }
				{ children }
			</div>
		);
	}
} );
