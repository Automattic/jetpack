import classNames from 'classnames';
import { Banner, connect as bannerConnect } from 'components/banner';
import Card from 'components/card';
import ConnectButton from 'components/connect-button';
import Gridicon from 'components/gridicon';
import PropTypes from 'prop-types';
import React from 'react';

export class ConnectionBanner extends Banner {
	static propTypes = {
		title: PropTypes.string.isRequired,
		className: PropTypes.string,
		description: PropTypes.node,
		icon: PropTypes.oneOfType( [ PropTypes.element, PropTypes.string ] ),
		connectUser: PropTypes.bool,
		from: PropTypes.string,
		asLink: PropTypes.bool,
		connectInPlace: PropTypes.bool,
	};

	getIcon() {
		const icon = this.props.icon;

		if ( icon && 'object' === typeof icon ) {
			return <div className="jp-connection-banner__icon">{ icon }</div>;
		}
		return (
			<div className="dops-banner__icons">
				<div className="dops-banner__icon">
					<Gridicon icon={ icon || 'info-outline' } size={ 18 } />
				</div>
				<div className="dops-banner__icon-circle">
					<Gridicon icon={ icon || 'info-outline' } size={ 18 } />
				</div>
			</div>
		);
	}

	getContent() {
		const { description, title, connectUser, from, asLink, connectInPlace } = this.props;

		const connectButtonProps = {
			connectUser: connectUser,
			from: from,
			asLink: asLink,
			connectInPlace: connectInPlace,
		};

		return (
			<div className="dops-banner__content">
				<div className="dops-banner__info">
					<div className="dops-banner__title">{ title }</div>
					{ description && <div className="dops-banner__description">{ description }</div> }
				</div>
				<div className="dops-banner__action">
					<ConnectButton { ...connectButtonProps } />
				</div>
			</div>
		);
	}

	render() {
		const classes = classNames( 'dops-banner', this.props.className );

		return (
			<Card className={ classes }>
				{ this.getIcon() }
				{ this.getContent() }
			</Card>
		);
	}
}

export default bannerConnect( ConnectionBanner );
