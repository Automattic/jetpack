import PropTypes from 'prop-types';
import { cloneElement, PureComponent } from 'react';
import { SocialLogoData } from './social-logo-data';
import type { SVGAttributes } from 'react';

export type SocialLogoProps = SVGAttributes< SVGSVGElement > & {
	icon: ( typeof SocialLogoData )[ number ][ 'name' ];
	size?: number;
};

export class SocialLogo extends PureComponent< SocialLogoProps > {
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

		const svg = cloneElement( logoData.svg, {
			className: iconClass,
			height: size,
			width: size,
			onClick: onClick,
			...otherProps,
		} );
		return svg;
	}
}
