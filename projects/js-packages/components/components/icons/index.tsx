import { Path, SVG, G, Polygon } from '@wordpress/components';
import classNames from 'classnames';
import styles from './style.module.scss';
import { BaseIconProps, SocialIconWrapperProps } from './types';
import type React from 'react';

/**
 * Icon Wrapper component.
 *
 * @param {BaseIconProps} props - Component props.
 * @returns {React.ReactNode} Icon Wrapper component.
 */
const IconWrapper: React.FC< BaseIconProps > = ( {
	className,
	size = 24,
	viewBox = '0 0 24 24',
	opacity = 1,
	color = '#2C3338',
	children,
} ) => {
	const iconProps = {
		className: classNames( styles.iconWrapper, className ),
		width: size,
		height: size,
		viewBox,
		opacity,
		fill: undefined,
	};
	if ( color ) {
		iconProps.fill = color;
	}

	return (
		<SVG { ...iconProps } fillRule="evenodd" clipRule="evenodd" xmlns="http://www.w3.org/2000/svg">
			<G opacity={ opacity }>{ children }</G>
		</SVG>
	);
};

export const AntiSpamIcon: React.FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path
			d="M13.2,4.7l4.7,12.8c0.4,1.1,1,1.5,2.1,1.6c0.1,0,0.1,0,0.1,0l0.1,0.1l0.1,0.1c0,0.1,0,0.1,0,0.2c0,0.1,0,0.1,0,0.1
		s0,0.1-0.1,0.1c-0.1,0-0.1,0.1-0.1,0.1s-0.1,0-0.2,0h-5.1c-0.1,0-0.1,0-0.2,0c-0.1,0-0.1-0.1-0.1-0.1l-0.1-0.1c0-0.1,0-0.1,0-0.1
		c0-0.1,0-0.1,0-0.2s0-0.1,0.1-0.1l0.1-0.1c0,0,0.1,0,0.2,0c0.5,0,1.1-0.2,1.1-0.8c0-0.3-0.1-0.5-0.2-0.8l-1.1-3.1
		c-0.1-0.2-0.1-0.2-0.2-0.2h-4.3c-0.7,0-1.5,0-1.9,0.9l-1.1,2.4C7.1,17.6,7,17.8,7,18.1c0,0.8,1,0.9,1.6,0.9c0.1,0,0.1,0,0.2,0
		L8.8,19l0.1,0.1c0,0.1,0,0.1,0,0.2c0,0.1,0,0.1,0,0.1s-0.1,0.1-0.1,0.1l-0.1,0.1c-0.1,0-0.1,0-0.2,0H4.1c-0.1,0-0.1,0-0.1,0
		c-0.1,0-0.1-0.1-0.1-0.1l-0.1-0.1c0-0.1,0-0.1,0-0.1c0-0.1,0-0.1,0-0.2s0-0.1,0.1-0.1L4,19c0,0,0.1,0,0.1,0C5.2,19,5.5,18.5,6,17.5
		l5.4-12.4c0.2-0.5,0.8-1,1.3-1C13,4.2,13.1,4.4,13.2,4.7z M9.1,13.1c0,0.1-0.1,0.1-0.1,0.2c0,0.1,0.1,0.1,0.1,0.1h4.4
		c0.3,0,0.4-0.1,0.4-0.3c0-0.1,0-0.2-0.1-0.3l-1.2-3.5c-0.3-0.8-0.8-1.9-0.8-2.7c0-0.1,0-0.1-0.1-0.1c0,0-0.1,0-0.1,0.1
		c-0.1,0.6-0.4,1.2-0.7,1.7L9.1,13.1z"
		/>
		<Path
			d="M13.2,4.7l4.7,12.8c0.4,1.1,1,1.5,2.1,1.6c0.1,0,0.1,0,0.1,0l0.1,0.1l0.1,0.1c0,0.1,0,0.1,0,0.2c0,0.1,0,0.1,0,0.1
			s0,0.1-0.1,0.1c-0.1,0-0.1,0.1-0.1,0.1s-0.1,0-0.2,0h-5.1c-0.1,0-0.1,0-0.2,0c-0.1,0-0.1-0.1-0.1-0.1l-0.1-0.1c0-0.1,0-0.1,0-0.1
			c0-0.1,0-0.1,0-0.2s0-0.1,0.1-0.1l0.1-0.1c0,0,0.1,0,0.2,0c0.5,0,1.1-0.2,1.1-0.8c0-0.3-0.1-0.5-0.2-0.8l-1.1-3.1
			c-0.1-0.2-0.1-0.2-0.2-0.2h-4.3c-0.7,0-1.5,0-1.9,0.9l-1.1,2.4C7.1,17.6,7,17.8,7,18.1c0,0.8,1,0.9,1.6,0.9c0.1,0,0.1,0,0.2,0
			L8.8,19l0.1,0.1c0,0.1,0,0.1,0,0.2c0,0.1,0,0.1,0,0.1s-0.1,0.1-0.1,0.1l-0.1,0.1c-0.1,0-0.1,0-0.2,0H4.1c-0.1,0-0.1,0-0.1,0
			c-0.1,0-0.1-0.1-0.1-0.1l-0.1-0.1c0-0.1,0-0.1,0-0.1c0-0.1,0-0.1,0-0.2s0-0.1,0.1-0.1L4,19c0,0,0.1,0,0.1,0C5.2,19,5.5,18.5,6,17.5
			l5.4-12.4c0.2-0.5,0.8-1,1.3-1C13,4.2,13.1,4.4,13.2,4.7z M9.1,13.1c0,0.1-0.1,0.1-0.1,0.2c0,0.1,0.1,0.1,0.1,0.1h4.4
			c0.3,0,0.4-0.1,0.4-0.3c0-0.1,0-0.2-0.1-0.3l-1.2-3.5c-0.3-0.8-0.8-1.9-0.8-2.7c0-0.1,0-0.1-0.1-0.1c0,0-0.1,0-0.1,0.1
			c-0.1,0.6-0.4,1.2-0.7,1.7L9.1,13.1z"
		/>
		<Path d="M21.6,12.5c0,0.6-0.3,1-0.9,1c-0.6,0-0.8-0.3-0.8-0.8c0-0.6,0.4-1,0.9-1C21.3,11.7,21.6,12.1,21.6,12.5z" />
		<Path d="M4.1,12.5c0,0.6-0.3,1-0.9,1s-0.8-0.3-0.8-0.8c0-0.6,0.4-1,0.9-1S4.1,12.1,4.1,12.5z" />
	</IconWrapper>
);

export const BackupIcon: React.FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path
			d="M2.1,5.8c0-0.1,0-0.1,0-0.2c0-0.2,0.1-0.5,0.1-0.7c0.1-0.4,0.4-0.6,0.7-0.8l8.3-2.9c0.1-0.1,0.3-0.1,0.4-0.1l0.5,0.1
			l8.3,2.9c0.3,0.2,0.5,0.4,0.7,0.7c0.2,0.2,0.2,0.4,0.2,0.7c0,0.1,0,0.1,0,0.2v0.1c-0.1,0.5-0.2,0.9-0.3,1.4
			c-0.2,0.4-0.3,1.2-0.7,2.2c-0.3,1-0.7,2.1-1.1,3.1c-0.5,1-1,2.1-1.6,3.3s-1.4,2.3-2.2,3.5c-0.9,1.1-1.8,2.2-2.8,3.1
			c-0.2,0.2-0.5,0.4-0.9,0.4c-0.3,0-0.6-0.1-0.9-0.4c-1.2-1.1-2.4-2.4-3.5-4c-1-1.6-1.9-3-2.5-4.3c-0.6-1.3-1.1-2.7-1.6-4
			C2.8,8.7,2.5,7.6,2.3,7C2.3,6.5,2.1,6.1,2.1,5.8z M2.9,5.9c0,0.2,0.1,0.4,0.1,0.8C3.1,7,3.2,7.5,3.5,8.2C3.7,9,3.9,9.7,4.2,10.6
			c0.3,0.7,0.7,1.7,1.1,2.7c0.4,1,1,2,1.5,2.9c0.5,1,1.2,1.9,1.9,2.9c0.8,1,1.6,1.9,2.4,2.6c0.2,0.2,0.4,0.2,0.5,0.2
			c0.2,0,0.4-0.1,0.5-0.2c1.2-1,2.2-2.3,3.2-3.8c1-1.5,1.8-2.8,2.3-4c0.6-1.3,1.1-2.5,1.5-3.9c0.4-1.3,0.7-2.2,0.9-2.8
			c0.1-0.5,0.2-1,0.3-1.3c0-0.1,0-0.1,0-0.1c0-0.2,0-0.3-0.1-0.4C20.3,5.2,20.2,5.1,20,5L12,2.1c0,0-0.1,0-0.2,0s-0.1,0-0.1,0h-0.2
			l-8,2.8C3.2,5,3.1,5.2,3,5.3C2.9,5.5,2.9,5.6,2.9,5.8C2.9,5.8,2.9,5.8,2.9,5.9z M5.9,6.7h3l2.8,7l2.8-7h3c-0.1,0.1-0.2,0.5-0.3,0.8
			C17,7.8,17,8.2,16.8,8.4c-0.1,0.3-0.2,0.5-0.4,0.8c0,0.1-0.1,0.1-0.1,0.1s-0.1,0.1-0.2,0.1c-0.1,0-0.1,0-0.1,0
			c-0.1,0-0.2,0.1-0.2,0.2c0,0-0.1,0.1-0.1,0.1s-0.1,0.1-0.1,0.1c0,0,0,0.1-0.1,0.2c0,0.1-0.1,0.1-0.1,0.1l-0.4,1.1
			c-1.3,3.3-2.1,5.2-2.3,5.8h-2.2l-1-2.4c-0.1-0.3-0.3-0.8-0.5-1.3c-0.1-0.3-0.3-0.8-0.5-1.3L8,10.8c-0.1-0.1-0.1-0.2-0.1-0.4
			C7.8,10.2,7.7,10,7.7,9.8C7.6,9.7,7.5,9.5,7.4,9.4C7.3,9.3,7.3,9.3,7.3,9.3c-0.1,0-0.2,0-0.2,0s-0.1,0-0.1,0
			C6.6,8.5,6.3,7.6,5.9,6.7z"
		/>
	</IconWrapper>
);

export const BoostIcon: React.FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M4.19505 16.2545C4.47368 16.561 4.94802 16.5836 5.25451 16.3049L10.2595 11.7549L14.2842 15.2765L19 10.5607V13.75H20.5V9.5V8.75239V8.7476V8H19.7529H19.7471H19H14.75V9.5H17.9393L14.2158 13.2235L10.2405 9.74507L4.2455 15.195C3.93901 15.4737 3.91642 15.948 4.19505 16.2545Z"
		/>
	</IconWrapper>
);

export const CrmIcon: React.FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="M15.5 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-2.25 6v-2a2.75 2.75 0 0 0-2.75-2.75h-4A2.75 2.75 0 0 0 3.75 15v2h1.5v-2c0-.69.56-1.25 1.25-1.25h4c.69 0 1.25.56 1.25 1.25v2h1.5Zm7-2v2h-1.5v-2c0-.69-.56-1.25-1.25-1.25H15v-1.5h2.5A2.75 2.75 0 0 1 20.25 15ZM9.5 8.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm1.5 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
	</IconWrapper>
);

export const ExtrasIcon: React.FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="M18.5 5.5V8H20V5.5h2.5V4H20V1.5h-1.5V4H16v1.5h2.5ZM12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6h-1.5v6a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5h6V4Z" />
	</IconWrapper>
);

export const ProtectIcon: React.FC< BaseIconProps > = ( {
	opacity = 1,
	size,
	className,
	color,
} ) => (
	<IconWrapper className={ className } size={ size } opacity={ opacity } color={ color }>
		<Path d="M12 3.17627L18.75 6.24445V10.8183C18.75 14.7173 16.2458 18.4089 12.7147 19.5735C12.2507 19.7265 11.7493 19.7265 11.2853 19.5735C7.75416 18.4089 5.25 14.7173 5.25 10.8183V6.24445L12 3.17627ZM6.75 7.21032V10.8183C6.75 14.1312 8.89514 17.2057 11.7551 18.149C11.914 18.2014 12.086 18.2014 12.2449 18.149C15.1049 17.2057 17.25 14.1312 17.25 10.8183V7.21032L12 4.82396L6.75 7.21032Z" />
		<Path d="M15.5291 10.0315L11.1818 14.358L8.47095 11.66L9.52907 10.5968L11.1818 12.2417L14.4709 8.96826L15.5291 10.0315Z" />
	</IconWrapper>
);

export const ScanIcon: React.FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="m12 3.176 6.75 3.068v4.574c0 3.9-2.504 7.59-6.035 8.755a2.283 2.283 0 0 1-1.43 0c-3.53-1.164-6.035-4.856-6.035-8.755V6.244L12 3.176ZM6.75 7.21v3.608c0 3.313 2.145 6.388 5.005 7.33.159.053.331.053.49 0 2.86-.942 5.005-4.017 5.005-7.33V7.21L12 4.824 6.75 7.21Z" />
	</IconWrapper>
);

export const SearchIcon: React.FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="M17.5 11.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1.5 0a5.5 5.5 0 0 1-9.142 4.121l-3.364 2.943-.988-1.128 3.373-2.952A5.5 5.5 0 1 1 19 11.5Z" />
	</IconWrapper>
);

export const SocialIcon: React.FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="M15.5 3.97809V18.0219L7.5 15.5977V20H6V15.1431L3.27498 14.3173C2.22086 13.9979 1.5 13.0262 1.5 11.9248V10.0752C1.5 8.97375 2.22087 8.00207 3.27498 7.68264L15.5 3.97809ZM14 16L7.5 14.0303L7.5 7.96969L14 5.99999V16ZM6 8.42423L6 13.5757L3.70999 12.8818C3.28835 12.754 3 12.3654 3 11.9248V10.0752C3 9.63462 3.28835 9.24595 3.70999 9.11818L6 8.42423ZM17.5 11.75H21.5V10.25H17.5V11.75ZM21.5 16L17.5 15V13.5L21.5 14.5V16ZM17.5 8.5L21.5 7.5V6L17.5 7V8.5Z" />
	</IconWrapper>
);

export const VideopressIcon: React.FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M4.3,6.2c0.8,0,1.6,0.6,1.8,1.4l2.3,7.9c0,0,0,0,0,0l2.7-9.3h1.5h4.2c2.9,0,4.9,1.9,4.9,4.7c0,2.9-2,4.7-5,4.7
			h-2h-2.5l-0.5,1.5c-0.4,1.4-1.7,2.3-3.2,2.3c-1.4,0-2.7-0.9-3.2-2.3L2.5,8.7C2.1,7.4,3,6.2,4.3,6.2z M13,12.8h2.9c1.3,0,2-0.7,2-1.9
			c0-1.2-0.8-1.8-2-1.8h-1.7L13,12.8z"
		/>
	</IconWrapper>
);

export const StarIcon: React.FC< BaseIconProps > = ( {
	size,
	className = styles[ 'star-icon' ],
	color,
} ) => (
	<IconWrapper className={ className } size={ size } color={ color }>
		<Path d="M12 2l2.582 6.953L22 9.257l-5.822 4.602L18.18 21 12 16.89 5.82 21l2.002-7.14L2 9.256l7.418-.304" />
	</IconWrapper>
);

export const CheckmarkIcon: React.FC< BaseIconProps > = ( {
	size,
	className = styles[ 'checkmark-icon' ],
	color,
} ) => (
	<IconWrapper className={ className } size={ size } color={ color }>
		<Path d="M11 17.768l-4.884-4.884 1.768-1.768L11 14.232l8.658-8.658C17.823 3.39 15.075 2 12 2 6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-1.528-.353-2.97-.966-4.266L11 17.768z" />
	</IconWrapper>
);

export const JetpackIcon: React.FC< BaseIconProps > = ( {
	size,
	className = styles.jetpack,
	color,
} ) => {
	return (
		<IconWrapper className={ className } size={ size } color={ color } viewBox="0 0 32 32">
			<Path
				className="jetpack-logo__icon-circle"
				d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z"
			/>
			<Polygon fill="#fff" points="15,19 7,19 15,3" />
			<Polygon fill="#fff" points="17,29 17,13 25,13" />
		</IconWrapper>
	);
};

/**
 * Wrapper of the Social Icons. Adds a default CSS class.
 *
 * @param {SocialIconWrapperProps} props - Component props.
 * @returns {React.ReactNode} - Social Icon component.
 */
const SocialIconWrapper: React.FC< SocialIconWrapperProps > = ( {
	className,
	fill = 'none',
	size,
	children,
} ) => {
	return (
		<IconWrapper
			className={ classNames( styles.socialIcon, className ) }
			size={ size }
			color={ fill }
		>
			{ children }
		</IconWrapper>
	);
};

export const FacebookIcon: React.FC< SocialIconWrapperProps > = ( { fill, size, className } ) => {
	return (
		<SocialIconWrapper
			fill={ fill }
			size={ size }
			className={ classNames( styles.facebook, className ) }
		>
			<Path
				d="M12,2C6.5,2,2,6.5,2,12c0,5,3.7,9.1,8.4,9.9v-7H7.9V12h2.5V9.8c0-2.5,1.5-3.9,3.8-3.9c1.1,0,2.2,0.2,2.2,0.2v2.5h-1.3
	c-1.2,0-1.6,0.8-1.6,1.6V12h2.8l-0.4,2.9h-2.3v7C18.3,21.1,22,17,22,12C22,6.5,17.5,2,12,2z"
			/>
		</SocialIconWrapper>
	);
};

export const InstagramIcon: React.FC< SocialIconWrapperProps > = ( { fill, size, className } ) => {
	return (
		<SocialIconWrapper
			fill={ fill }
			size={ size }
			className={ classNames( styles.instagram, className ) }
		>
			<Path d="M12,4.622c2.403,0,2.688,0.009,3.637,0.052c0.877,0.04,1.354,0.187,1.671,0.31c0.42,0.163,0.72,0.358,1.035,0.673 c0.315,0.315,0.51,0.615,0.673,1.035c0.123,0.317,0.27,0.794,0.31,1.671c0.043,0.949,0.052,1.234,0.052,3.637 s-0.009,2.688-0.052,3.637c-0.04,0.877-0.187,1.354-0.31,1.671c-0.163,0.42-0.358,0.72-0.673,1.035 c-0.315,0.315-0.615,0.51-1.035,0.673c-0.317,0.123-0.794,0.27-1.671,0.31c-0.949,0.043-1.233,0.052-3.637,0.052 s-2.688-0.009-3.637-0.052c-0.877-0.04-1.354-0.187-1.671-0.31c-0.42-0.163-0.72-0.358-1.035-0.673 c-0.315-0.315-0.51-0.615-0.673-1.035c-0.123-0.317-0.27-0.794-0.31-1.671C4.631,14.688,4.622,14.403,4.622,12 s0.009-2.688,0.052-3.637c0.04-0.877,0.187-1.354,0.31-1.671c0.163-0.42,0.358-0.72,0.673-1.035 c0.315-0.315,0.615-0.51,1.035-0.673c0.317-0.123,0.794-0.27,1.671-0.31C9.312,4.631,9.597,4.622,12,4.622 M12,3 C9.556,3,9.249,3.01,8.289,3.054C7.331,3.098,6.677,3.25,6.105,3.472C5.513,3.702,5.011,4.01,4.511,4.511 c-0.5,0.5-0.808,1.002-1.038,1.594C3.25,6.677,3.098,7.331,3.054,8.289C3.01,9.249,3,9.556,3,12c0,2.444,0.01,2.751,0.054,3.711 c0.044,0.958,0.196,1.612,0.418,2.185c0.23,0.592,0.538,1.094,1.038,1.594c0.5,0.5,1.002,0.808,1.594,1.038 c0.572,0.222,1.227,0.375,2.185,0.418C9.249,20.99,9.556,21,12,21s2.751-0.01,3.711-0.054c0.958-0.044,1.612-0.196,2.185-0.418 c0.592-0.23,1.094-0.538,1.594-1.038c0.5-0.5,0.808-1.002,1.038-1.594c0.222-0.572,0.375-1.227,0.418-2.185 C20.99,14.751,21,14.444,21,12s-0.01-2.751-0.054-3.711c-0.044-0.958-0.196-1.612-0.418-2.185c-0.23-0.592-0.538-1.094-1.038-1.594 c-0.5-0.5-1.002-0.808-1.594-1.038c-0.572-0.222-1.227-0.375-2.185-0.418C14.751,3.01,14.444,3,12,3L12,3z M12,7.378 c-2.552,0-4.622,2.069-4.622,4.622S9.448,16.622,12,16.622s4.622-2.069,4.622-4.622S14.552,7.378,12,7.378z M12,15 c-1.657,0-3-1.343-3-3s1.343-3,3-3s3,1.343,3,3S13.657,15,12,15z M16.804,6.116c-0.596,0-1.08,0.484-1.08,1.08 s0.484,1.08,1.08,1.08c0.596,0,1.08-0.484,1.08-1.08S17.401,6.116,16.804,6.116z" />
		</SocialIconWrapper>
	);
};

export const TwitterIcon: React.FC< SocialIconWrapperProps > = ( { fill, size, className } ) => {
	return (
		<SocialIconWrapper
			fill={ fill }
			size={ size }
			className={ classNames( styles.twitter, className ) }
		>
			<Path d="M22.23,5.924c-0.736,0.326-1.527,0.547-2.357,0.646c0.847-0.508,1.498-1.312,1.804-2.27 c-0.793,0.47-1.671,0.812-2.606,0.996C18.324,4.498,17.257,4,16.077,4c-2.266,0-4.103,1.837-4.103,4.103 c0,0.322,0.036,0.635,0.106,0.935C8.67,8.867,5.647,7.234,3.623,4.751C3.27,5.357,3.067,6.062,3.067,6.814 c0,1.424,0.724,2.679,1.825,3.415c-0.673-0.021-1.305-0.206-1.859-0.513c0,0.017,0,0.034,0,0.052c0,1.988,1.414,3.647,3.292,4.023 c-0.344,0.094-0.707,0.144-1.081,0.144c-0.264,0-0.521-0.026-0.772-0.074c0.522,1.63,2.038,2.816,3.833,2.85 c-1.404,1.1-3.174,1.756-5.096,1.756c-0.331,0-0.658-0.019-0.979-0.057c1.816,1.164,3.973,1.843,6.29,1.843 c7.547,0,11.675-6.252,11.675-11.675c0-0.178-0.004-0.355-0.012-0.531C20.985,7.47,21.68,6.747,22.23,5.924z" />
		</SocialIconWrapper>
	);
};

export const LinkedinIcon: React.FC< SocialIconWrapperProps > = ( { fill, size, className } ) => {
	return (
		<SocialIconWrapper
			fill={ fill }
			size={ size }
			className={ classNames( styles.linkedin, className ) }
		>
			<Path d="M19.7,3H4.3C3.582,3,3,3.582,3,4.3v15.4C3,20.418,3.582,21,4.3,21h15.4c0.718,0,1.3-0.582,1.3-1.3V4.3 C21,3.582,20.418,3,19.7,3z M8.339,18.338H5.667v-8.59h2.672V18.338z M7.004,8.574c-0.857,0-1.549-0.694-1.549-1.548 c0-0.855,0.691-1.548,1.549-1.548c0.854,0,1.547,0.694,1.547,1.548C8.551,7.881,7.858,8.574,7.004,8.574z M18.339,18.338h-2.669 v-4.177c0-0.996-0.017-2.278-1.387-2.278c-1.389,0-1.601,1.086-1.601,2.206v4.249h-2.667v-8.59h2.559v1.174h0.037 c0.356-0.675,1.227-1.387,2.526-1.387c2.703,0,3.203,1.779,3.203,4.092V18.338z" />
		</SocialIconWrapper>
	);
};

export const TumblrIcon: React.FC< SocialIconWrapperProps > = ( { fill, size, className } ) => {
	return (
		<SocialIconWrapper
			fill={ fill }
			size={ size }
			className={ classNames( styles.tumblr, className ) }
		>
			<Path d="M17.04 21.28h-3.28c-2.84 0-4.94-1.37-4.94-5.02v-5.67H6.08V7.5c2.93-.73 4.11-3.3 4.3-5.48h3.01v4.93h3.47v3.65H13.4v4.93c0 1.47.73 2.01 1.92 2.01h1.73v3.75z" />
		</SocialIconWrapper>
	);
};

export const GoogleIcon: React.FC< SocialIconWrapperProps > = ( { fill, size, className } ) => {
	return (
		<SocialIconWrapper
			fill={ fill }
			size={ size }
			className={ classNames( styles.google, className ) }
		>
			<Path d="M12.02 10.18v3.73h5.51c-.26 1.57-1.67 4.22-5.5 4.22-3.31 0-6.01-2.75-6.01-6.12s2.7-6.12 6.01-6.12c1.87 0 3.13.8 3.85 1.48l2.84-2.76C16.99 2.99 14.73 2 12.03 2c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.83-.11-1.42-.25-2.05h-9.36z" />
		</SocialIconWrapper>
	);
};

export const MastodonIcon: React.FC< SocialIconWrapperProps > = ( { fill, size, className } ) => {
	return (
		<SocialIconWrapper
			fill={ fill }
			size={ size }
			className={ classNames( styles.mastodon, className ) }
		>
			<Path d="M 19.997205,6.2868955 C 19.729197,4.3162778 17.992912,2.7633017 15.93468,2.4623753 15.587434,2.4115195 14.271759,2.2264681 11.224008,2.2264681 h -0.02277 c -3.0485688,0 -3.7026204,0.1850577 -4.0498676,0.2359072 C 5.1504449,2.7549655 3.3231548,4.1503966 2.879815,6.1443318 2.6665754,7.1263038 2.6438193,8.2149794 2.6834329,9.2136207 c 0.056471,1.4321143 0.067433,2.8617113 0.1989115,4.2879943 0.090908,0.947406 0.2494696,1.887266 0.4745239,2.812521 0.4214237,1.708868 2.1273496,3.130966 3.7987144,3.71116 1.7894479,0.605052 3.7138403,0.705478 5.5577463,0.290088 0.202828,-0.04667 0.403445,-0.100873 0.601781,-0.162549 0.447558,-0.140863 0.972662,-0.298434 1.358683,-0.575188 0.0052,-0.004 0.0097,-0.0089 0.01266,-0.01471 0.0031,-0.0056 0.0047,-0.01218 0.005,-0.01866 v -1.382076 c -9.4e-5,-0.006 -0.0016,-0.01202 -0.0043,-0.01754 -0.0027,-0.0054 -0.0067,-0.01028 -0.01155,-0.01392 -0.0049,-0.0038 -0.01044,-0.0063 -0.01648,-0.0078 -0.006,-0.0013 -0.01218,-0.0013 -0.01825,7.1e-5 -1.181368,0.279106 -2.391962,0.419012 -3.606552,0.416801 -2.0902554,0 -2.6524392,-0.981126 -2.8134375,-1.3896 -0.1293933,-0.353009 -0.2115739,-0.721231 -0.2444221,-1.095331 -3.29e-4,-0.0063 8.463e-4,-0.0125 0.00348,-0.01832 0.00253,-0.0056 0.00649,-0.01077 0.011389,-0.01471 0.0049,-0.004 0.010755,-0.0068 0.016957,-0.0081 0.00617,-0.0014 0.012655,-0.0012 0.018808,3.52e-4 1.1616831,0.277201 2.3525266,0.417106 3.5475526,0.416801 0.287408,0 0.573966,0 0.861395,-0.0074 1.201893,-0.03335 2.468685,-0.0942 3.6512,-0.322606 0.02952,-0.0058 0.059,-0.01091 0.0843,-0.01833 1.865209,-0.354279 3.640245,-1.466278 3.820617,-4.282163 0.0068,-0.110869 0.0236,-1.161191 0.0236,-1.276219 8.46e-4,-0.390958 0.127273,-2.7733487 -0.01856,-4.2371335 z m -2.87074,7.0263315 H 15.165179 V 8.5617567 c 0,-1.0003116 -0.421434,-1.5104614 -1.278618,-1.5104614 -0.942305,0 -1.414292,0.6035217 -1.414292,1.7955379 V 11.44764 H 10.522764 V 8.8468332 c 0,-1.1920162 -0.472832,-1.7955379 -1.4151372,-1.7955379 -0.8521293,0 -1.2777701,0.5101498 -1.2786179,1.5104614 V 13.313227 H 5.8693944 V 8.4175496 c 0,-1.0003133 0.2582014,-1.7949986 0.7745804,-2.3840846 0.5326766,-0.587672 1.2314038,-0.8894211 2.0986981,-0.8894211 1.003817,0 1.7623841,0.3817657 2.2680911,1.1445204 l 0.488023,0.8102521 0.488846,-0.8102521 c 0.505705,-0.7627547 1.264275,-1.1445204 2.26642,-1.1445204 0.866449,0 1.565152,0.3017491 2.099521,0.8894211 0.516404,0.5885211 0.774583,1.3832066 0.774583,2.3840846 z" />
		</SocialIconWrapper>
	);
};

const jetpackIcons = {
	'anti-spam': AntiSpamIcon,
	backup: BackupIcon,
	boost: BoostIcon,
	crm: CrmIcon,
	extras: ExtrasIcon,
	protect: ProtectIcon,
	scan: ScanIcon,
	search: SearchIcon,
	social: SocialIcon,
	star: StarIcon,
	videopress: VideopressIcon,
	jetpack: JetpackIcon,
};

const socialIcons = {
	facebook: FacebookIcon,
	instagram: InstagramIcon,
	twitter: TwitterIcon,
	linkedin: LinkedinIcon,
	tumblr: TumblrIcon,
	google: GoogleIcon,
	mastodon: MastodonIcon,
};

const iconsMap = {
	...jetpackIcons,
	...socialIcons,
};

export type JetpackIconSlug = keyof typeof jetpackIcons;

export type SocialIconSlug = keyof typeof socialIcons;

export type IconsMap = typeof iconsMap;

export type IconSlug = keyof IconsMap;

/**
 * Return icon component by slug.
 *
 * @param {string} slug       - Icon slug.
 * @returns {React.ComponentType<BaseIconProps>}   Icon component.
 */
export function getIconBySlug< Slug extends IconSlug >( slug: Slug ): IconsMap[ Slug ] {
	if ( ! iconsMap[ slug ] ) {
		return null;
	}

	return iconsMap[ slug ];
}

export const SocialServiceIcon: React.FC< {
	serviceName: keyof typeof socialIcons;
	className?: string;
} > = ( { serviceName, className } ) => {
	const Icon = getIconBySlug( serviceName );
	return Icon ? <Icon className={ className } /> : null;
};
