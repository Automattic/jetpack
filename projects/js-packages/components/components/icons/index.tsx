import { Path, SVG, G, Polygon } from '@wordpress/components';
import classNames from 'classnames';
import SocialLogo from 'social-logos';
import styles from './style.module.scss';
import { BaseIconProps } from './types';
import type { FC, ComponentProps } from 'react';

/**
 * Icon Wrapper component.
 *
 * @param {BaseIconProps} props - Component props.
 * @returns {ReactNode} Icon Wrapper component.
 */
const IconWrapper: FC< BaseIconProps > = ( {
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

export const JetpackAiIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="M4.49993 0L5.7727 3.22716L8.99986 4.49993L5.7727 5.7727L4.49993 8.99986L3.22716 5.7727L0 4.49993L3.22716 3.22716L4.49993 0Z" />
		<Path d="M17.9999 0L19.6969 4.30288L23.9998 5.99991L19.6969 7.69694L17.9999 11.9998L16.3029 7.69694L12 5.99991L16.3029 4.30288L17.9999 0Z" />
		<Path d="M10.4999 8.99976L12.6212 14.3784L17.9998 16.4996L12.6212 18.6209L10.4999 23.9995L8.3786 18.6209L3 16.4996L8.3786 14.3784L10.4999 8.99976Z" />
	</IconWrapper>
);

export const AntiSpamIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
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

export const BackupIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
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

export const BoostIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M0.000488281 1.1296L6.02967 7.76188L0.000490665 14.3941L1.08598 15.3809L7.56368 8.25527L8.01221 7.76188L7.56368 7.26849L1.08598 0.142822L0.000488281 1.1296ZM7.77295 1.1296L13.8021 7.76188L7.77295 14.3941L8.85844 15.3809L15.3361 8.25527L15.7847 7.76188L15.3361 7.26849L8.85844 0.142822L7.77295 1.1296Z"
		/>
	</IconWrapper>
);

export const CrmIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="M15.5 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-2.25 6v-2a2.75 2.75 0 0 0-2.75-2.75h-4A2.75 2.75 0 0 0 3.75 15v2h1.5v-2c0-.69.56-1.25 1.25-1.25h4c.69 0 1.25.56 1.25 1.25v2h1.5Zm7-2v2h-1.5v-2c0-.69-.56-1.25-1.25-1.25H15v-1.5h2.5A2.75 2.75 0 0 1 20.25 15ZM9.5 8.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm1.5 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
	</IconWrapper>
);

export const ExtrasIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="M18.5 5.5V8H20V5.5h2.5V4H20V1.5h-1.5V4H16v1.5h2.5ZM12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6h-1.5v6a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5h6V4Z" />
	</IconWrapper>
);

export const ProtectIcon: FC< BaseIconProps > = ( { opacity = 1, size, className, color } ) => (
	<IconWrapper className={ className } size={ size } opacity={ opacity } color={ color }>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M7.47203 0.381104L14.3242 3.49572V8.13879C14.3242 12.0968 11.7821 15.8443 8.19755 17.0265C7.72652 17.1818 7.21755 17.1818 6.74652 17.0265C3.16193 15.8443 0.619873 12.0968 0.619873 8.13879V3.49572L7.47203 0.381104ZM2.14258 4.47621V8.13879C2.14258 11.5019 4.32018 14.6229 7.22345 15.5804C7.38473 15.6336 7.55934 15.6336 7.72062 15.5804C10.6239 14.6229 12.8015 11.5019 12.8015 8.13879V4.47621L7.47203 2.05373L2.14258 4.47621Z"
		/>
	</IconWrapper>
);

export const ScanIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="m12 3.176 6.75 3.068v4.574c0 3.9-2.504 7.59-6.035 8.755a2.283 2.283 0 0 1-1.43 0c-3.53-1.164-6.035-4.856-6.035-8.755V6.244L12 3.176ZM6.75 7.21v3.608c0 3.313 2.145 6.388 5.005 7.33.159.053.331.053.49 0 2.86-.942 5.005-4.017 5.005-7.33V7.21L12 4.824 6.75 7.21Z" />
	</IconWrapper>
);

export const SearchIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="M17.5 11.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1.5 0a5.5 5.5 0 0 1-9.142 4.121l-3.364 2.943-.988-1.128 3.373-2.952A5.5 5.5 0 1 1 19 11.5Z" />
	</IconWrapper>
);

export const SocialIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="M15.5 3.97809V18.0219L7.5 15.5977V20H6V15.1431L3.27498 14.3173C2.22086 13.9979 1.5 13.0262 1.5 11.9248V10.0752C1.5 8.97375 2.22087 8.00207 3.27498 7.68264L15.5 3.97809ZM14 16L7.5 14.0303L7.5 7.96969L14 5.99999V16ZM6 8.42423L6 13.5757L3.70999 12.8818C3.28835 12.754 3 12.3654 3 11.9248V10.0752C3 9.63462 3.28835 9.24595 3.70999 9.11818L6 8.42423ZM17.5 11.75H21.5V10.25H17.5V11.75ZM21.5 16L17.5 15V13.5L21.5 14.5V16ZM17.5 8.5L21.5 7.5V6L17.5 7V8.5Z" />
	</IconWrapper>
);

export const VideopressIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
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

export const StarIcon: FC< BaseIconProps > = ( {
	size,
	className = styles[ 'star-icon' ],
	color,
} ) => (
	<IconWrapper className={ className } size={ size } color={ color }>
		<Path d="M12 2l2.582 6.953L22 9.257l-5.822 4.602L18.18 21 12 16.89 5.82 21l2.002-7.14L2 9.256l7.418-.304" />
	</IconWrapper>
);

export const StatsIcon: FC< BaseIconProps > = ( { opacity = 1, size, color } ) => (
	<IconWrapper size={ size } opacity={ opacity } color={ color }>
		<Path d="M11.25 5H12.75V20H11.25V5Z" />
		<Path d="M6 10H7.5V20H6V10Z" />
		<Path d="M18 14H16.5V20H18V14Z" />
	</IconWrapper>
);

export const CheckmarkIcon: FC< BaseIconProps > = ( {
	size,
	className = styles[ 'checkmark-icon' ],
	color,
} ) => (
	<IconWrapper className={ className } size={ size } color={ color }>
		<Path d="M11 17.768l-4.884-4.884 1.768-1.768L11 14.232l8.658-8.658C17.823 3.39 15.075 2 12 2 6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-1.528-.353-2.97-.966-4.266L11 17.768z" />
	</IconWrapper>
);

export const ClipboardIcon: FC< BaseIconProps > = ( {
	size,
	className = styles[ 'clipboard-icon' ],
	color,
} ) => (
	<IconWrapper className={ className } size={ size } color={ color }>
		<Path d="M5.625 5.5H15.375C15.444 5.5 15.5 5.55596 15.5 5.625V15.375C15.5 15.444 15.444 15.5 15.375 15.5H5.625C5.55596 15.5 5.5 15.444 5.5 15.375V5.625C5.5 5.55596 5.55596 5.5 5.625 5.5ZM4 5.625C4 4.72754 4.72754 4 5.625 4H15.375C16.2725 4 17 4.72754 17 5.625V10V15.375C17 16.2725 16.2725 17 15.375 17C15.375 17 6.52246 17 5.625 17C4.72754 17 4 16.2725 4 15.375V5.625ZM18.5 17.2812V8.28125H20V17.2812C20 18.7995 18.7704 20 17.2511 20H6.25V18.5H17.2511C17.9409 18.5 18.5 17.9721 18.5 17.2812Z" />
	</IconWrapper>
);

export const JetpackIcon: FC< BaseIconProps > = ( { size, className = styles.jetpack, color } ) => {
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

export const ShareIcon: FC< BaseIconProps > = ( { size = 16, className, color } ) => {
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

const jetpackIcons = {
	'jetpack-ai': JetpackAiIcon,
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
	stats: StatsIcon,
	videopress: VideopressIcon,
	jetpack: JetpackIcon,
	share: ShareIcon,
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
 * @returns {ComponentType<BaseIconProps>}   Icon component.
 */
export function getIconBySlug< Slug extends IconSlug >( slug: Slug ): IconsMap[ Slug ] {
	if ( ! iconsMap[ slug ] ) {
		return null;
	}

	return iconsMap[ slug ];
}

export const SocialServiceIcon: FC< {
	serviceName: ComponentProps< typeof SocialLogo >[ 'icon' ];
	className?: string;
} > = ( { serviceName, className } ) => {
	return (
		<SocialLogo
			className={ classNames( styles.socialIcon, styles[ serviceName ], className ) }
			icon={ serviceName }
		/>
	);
};
