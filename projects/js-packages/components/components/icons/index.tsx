import { Path, SVG, G, Polygon } from '@wordpress/components';
import clsx from 'clsx';
import SocialLogo from 'social-logos';
import styles from './style.module.scss';
import { BaseIconProps } from './types';
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
		className: clsx( styles.iconWrapper, className ),
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

export const ClipboardIcon: React.FC< BaseIconProps > = ( {
	size,
	className = styles[ 'clipboard-icon' ],
	color,
} ) => (
	<IconWrapper className={ className } size={ size } color={ color }>
		<Path d="M5.625 5.5H15.375C15.444 5.5 15.5 5.55596 15.5 5.625V15.375C15.5 15.444 15.444 15.5 15.375 15.5H5.625C5.55596 15.5 5.5 15.444 5.5 15.375V5.625C5.5 5.55596 5.55596 5.5 5.625 5.5ZM4 5.625C4 4.72754 4.72754 4 5.625 4H15.375C16.2725 4 17 4.72754 17 5.625V10V15.375C17 16.2725 16.2725 17 15.375 17C15.375 17 6.52246 17 5.625 17C4.72754 17 4 16.2725 4 15.375V5.625ZM18.5 17.2812V8.28125H20V17.2812C20 18.7995 18.7704 20 17.2511 20H6.25V18.5H17.2511C17.9409 18.5 18.5 17.9721 18.5 17.2812Z" />
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

export const ShareIcon: React.FC< BaseIconProps > = ( { size = 16, className, color } ) => {
	return (
		<IconWrapper className={ className } size={ size } color={ color } viewBox="0 0 16 16">
			<Path
				fill="#161722"
				fillRule="evenodd"
				d="M8.3 4.66C3.85 5.308.727 9.75.034 13.69l-.02.117c-.137.842.809 1.232 1.446.68 2.013-1.745 3.648-2.475 5.318-2.719a10.482 10.482 0 011.524-.103v2.792c0 .694.82 1.041 1.3.55l6.176-6.307a.79.79 0 00.012-1.088L9.614 1.004C9.14.496 8.301.84 8.301 1.542v3.117zm1.525-1.175v1.85a.773.773 0 01-.654.77l-.655.096c-2.133.311-3.987 1.732-5.295 3.672-.472.7-.854 1.44-1.143 2.18a12.32 12.32 0 011.675-.972c1.58-.75 3.048-.972 4.548-.972h.762a.77.77 0 01.762.779v1.69l4.347-4.44-4.347-4.653z"
				clipRule="evenodd"
			></Path>
		</IconWrapper>
	);
};

export const AiIcon: React.FC< BaseIconProps > = ( {
	size = 24,
	color = '#069e08', // JP green
} ) => {
	return (
		<IconWrapper color={ color } size={ size } viewBox={ '0 0 32 32' }>
			<Path
				className="spark-first"
				d="M9.33301 5.33325L10.4644 8.20188L13.333 9.33325L10.4644 10.4646L9.33301 13.3333L8.20164 10.4646L5.33301 9.33325L8.20164 8.20188L9.33301 5.33325Z"
			/>
			<Path
				className="spark-second"
				d="M21.3333 5.33333L22.8418 9.15817L26.6667 10.6667L22.8418 12.1752L21.3333 16L19.8248 12.1752L16 10.6667L19.8248 9.15817L21.3333 5.33333Z"
			/>
			<Path
				className="spark-third"
				d="M14.6667 13.3333L16.5523 18.1144L21.3333 20L16.5523 21.8856L14.6667 26.6667L12.781 21.8856L8 20L12.781 18.1144L14.6667 13.3333Z"
			/>
		</IconWrapper>
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
	share: ShareIcon,
	ai: AiIcon,
};

const iconsMap = {
	...jetpackIcons,
};

export type JetpackIconSlug = keyof typeof jetpackIcons;

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
	serviceName: React.ComponentProps< typeof SocialLogo >[ 'icon' ];
	className?: string;
	iconSize?: number;
} > = ( { serviceName, className, iconSize } ) => {
	return (
		<SocialLogo
			className={ clsx( styles.socialIcon, styles[ serviceName ], className ) }
			icon={ serviceName }
			size={ iconSize || 24 }
		/>
	);
};
