import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { SocialLogoData } from './social-logo-data';

export default class SocialLogo extends PureComponent {
	static defaultProps = {
		size: 24,
	};

	static propTypes = {
		icon: PropTypes.string.isRequired,
		size: PropTypes.number,
		onClick: PropTypes.func,
		className: PropTypes.string,
	};

	render() {
		const { size, onClick, icon, className, ...otherProps } = this.props;

		const iconClass = [ 'social-logo', 'social-logo-' + icon, className ]
			.filter( Boolean )
			.join( ' ' );

		const logoData = SocialLogoData.find( logo => logo.name === icon );

		if ( ! logoData ) {
			return <svg height={ size } width={ size } { ...otherProps } />;
		}

		const svg = React.cloneElement( logoData.svg, {
			className: iconClass,
			height: size,
			width: size,
			onClick: onClick,
			...otherProps,
		} );
		return svg;
	}
}
