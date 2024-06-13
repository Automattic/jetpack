import clsx from 'clsx';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React from 'react';

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
		externalLink: '',
	};

	trackCogClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'settings-cog',
			group: 'security',
			page: 'aag',
		} );
	};

	render() {
		let externalLink;
		let children;

		const classes = clsx( this.props.className, 'jp-dash-section-header' );

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
			children = <div className="jp-dash-section-header__children">{ this.props.children }</div>;
		}

		return (
			<div className={ classes }>
				<div className="jp-dash-section-header__label">
					<h2 className="jp-dash-section-header__name">{ this.props.label }</h2>
				</div>
				{ externalLink }
				{ children }
			</div>
		);
	}
}

export default DashSectionHeader;
