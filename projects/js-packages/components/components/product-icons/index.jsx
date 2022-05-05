/**
 * External dependencies
 */
import React from 'react';
import { Path, SVG, G, Polygon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * Icon Wrapper component.
 *
 * @param {object} props           - Component props.
 * @param {number} props.size      - Icon size.
 * @param {number} props.opacity  - Opacity for SVG shapes
 * @param {string} props.viewBox   - Icon viewBox.
 * @param {object} props.children  - Icon component children.
 * @param {string} props.className - Icon class name. Optional.
 * @param {string} props.color     - RGB Icon color. Optional.
 * @returns {object}                 Icon Wrapper component.
 */
function IconWrapper( {
	className,
	size = 24,
	viewBox = '0 0 24 24',
	opacity = 1,
	color = '#2C3338',
	children,
} ) {
	return (
		<SVG
			className={ className }
			width={ size }
			height={ size }
			viewBox={ viewBox }
			fill={ color }
			fillRule="evenodd"
			clipRule="evenodd"
			xmlns="http://www.w3.org/2000/svg"
		>
			<G opacity={ opacity }>{ children }</G>
		</SVG>
	);
}

export const AntiSpamIcon = ( { opacity = 1, size } ) => (
	<IconWrapper size={ size } opacity={ opacity }>
		<Path d="m8.455 21.207 8-17.5-.91-.416-1.261 2.76A4.979 4.979 0 0 0 12 5.5c-1.062 0-2.046.33-2.855.895L7.19 4.44 6.13 5.5l1.926 1.927A4.975 4.975 0 0 0 7.025 10H5v1.5h2V13H5v1.5h2.1a5.001 5.001 0 0 0 1.937 3.028L7.545 20.79l.91.416ZM9.68 16.12A3.492 3.492 0 0 1 8.5 13.5v-3a3.5 3.5 0 0 1 5.159-3.083L9.68 16.121Zm5.675-6.62.81-1.77c.44.663.728 1.436.81 2.269H19v1.5h-2V13h2v1.5h-2.1a5.002 5.002 0 0 1-5.634 3.947l.662-1.448L12 17a3.5 3.5 0 0 0 3.5-3.5v-3a3.5 3.5 0 0 0-.145-.998Z" />
	</IconWrapper>
);

export const BackupIcon = ( { opacity = 1, size } ) => (
	<IconWrapper size={ size } opacity={ opacity }>
		<Path
			d="m15.82 11.373.013-1.277v-.03c0-1.48-1.352-2.9-3.3-2.9-1.627 0-2.87 1.015-3.205 2.208l-.32 1.143-1.186-.048a2.192 2.192 0 0 0-.089-.002c-1.19 0-2.233 1.008-2.233 2.35 0 1.34 1.04 2.348 2.23 2.35H16.8c.895 0 1.7-.762 1.7-1.8 0-.927-.649-1.643-1.423-1.777l-1.258-.217ZM7.883 8.97l-.15-.003C5.67 8.967 4 10.69 4 12.817c0 2.126 1.671 3.85 3.733 3.85H16.8c1.767 0 3.2-1.478 3.2-3.3 0-1.635-1.154-2.993-2.667-3.255v-.045c0-2.43-2.149-4.4-4.8-4.4-2.237 0-4.118 1.403-4.65 3.303Z"
			fill="#000"
		/>
	</IconWrapper>
);

export const BoostIcon = ( { opacity = 1, size } ) => (
	<IconWrapper size={ size } opacity={ opacity }>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M4.19505 16.2545C4.47368 16.561 4.94802 16.5836 5.25451 16.3049L10.2595 11.7549L14.2842 15.2765L19 10.5607V13.75H20.5V9.5V8.75239V8.7476V8H19.7529H19.7471H19H14.75V9.5H17.9393L14.2158 13.2235L10.2405 9.74507L4.2455 15.195C3.93901 15.4737 3.91642 15.948 4.19505 16.2545Z"
		/>
	</IconWrapper>
);

export const CrmIcon = ( { opacity = 1, size } ) => (
	<IconWrapper size={ size } opacity={ opacity }>
		<Path d="M15.5 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-2.25 6v-2a2.75 2.75 0 0 0-2.75-2.75h-4A2.75 2.75 0 0 0 3.75 15v2h1.5v-2c0-.69.56-1.25 1.25-1.25h4c.69 0 1.25.56 1.25 1.25v2h1.5Zm7-2v2h-1.5v-2c0-.69-.56-1.25-1.25-1.25H15v-1.5h2.5A2.75 2.75 0 0 1 20.25 15ZM9.5 8.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm1.5 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
	</IconWrapper>
);

export const ExtrasIcon = ( { opacity = 1, size } ) => (
	<IconWrapper size={ size } opacity={ opacity }>
		<Path d="M18.5 5.5V8H20V5.5h2.5V4H20V1.5h-1.5V4H16v1.5h2.5ZM12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6h-1.5v6a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5h6V4Z" />
	</IconWrapper>
);

export const ProtectIcon = ( { opacity = 1, size, className } ) => (
	<IconWrapper className={ className } size={ size } opacity={ opacity }>
		<Path d="M12 3.17627L18.75 6.24445V10.8183C18.75 14.7173 16.2458 18.4089 12.7147 19.5735C12.2507 19.7265 11.7493 19.7265 11.2853 19.5735C7.75416 18.4089 5.25 14.7173 5.25 10.8183V6.24445L12 3.17627ZM6.75 7.21032V10.8183C6.75 14.1312 8.89514 17.2057 11.7551 18.149C11.914 18.2014 12.086 18.2014 12.2449 18.149C15.1049 17.2057 17.25 14.1312 17.25 10.8183V7.21032L12 4.82396L6.75 7.21032Z" />
		<Path d="M15.5291 10.0315L11.1818 14.358L8.47095 11.66L9.52907 10.5968L11.1818 12.2417L14.4709 8.96826L15.5291 10.0315Z" />
	</IconWrapper>
);

export const ScanIcon = ( { opacity = 1, size } ) => (
	<IconWrapper size={ size } opacity={ opacity }>
		<Path d="m12 3.176 6.75 3.068v4.574c0 3.9-2.504 7.59-6.035 8.755a2.283 2.283 0 0 1-1.43 0c-3.53-1.164-6.035-4.856-6.035-8.755V6.244L12 3.176ZM6.75 7.21v3.608c0 3.313 2.145 6.388 5.005 7.33.159.053.331.053.49 0 2.86-.942 5.005-4.017 5.005-7.33V7.21L12 4.824 6.75 7.21Z" />
	</IconWrapper>
);

export const SearchIcon = ( { opacity = 1, size } ) => (
	<IconWrapper size={ size } opacity={ opacity }>
		<Path d="M17.5 11.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1.5 0a5.5 5.5 0 0 1-9.142 4.121l-3.364 2.943-.988-1.128 3.373-2.952A5.5 5.5 0 1 1 19 11.5Z" />
	</IconWrapper>
);

export const VideopressIcon = ( { opacity = 1, size } ) => (
	<IconWrapper size={ size } opacity={ opacity }>
		<Path d="M5.286 4.5h13.428c.434 0 .786.352.786.786v13.428a.786.786 0 0 1-.786.786H5.286a.786.786 0 0 1-.786-.786V5.286c0-.434.352-.786.786-.786ZM3 5.286A2.286 2.286 0 0 1 5.286 3h13.428A2.286 2.286 0 0 1 21 5.286v13.428A2.286 2.286 0 0 1 18.714 21H5.286A2.286 2.286 0 0 1 3 18.714V5.286ZM15 12l-5-3v6l5-3Z" />
	</IconWrapper>
);

export const StarIcon = ( { size, className = styles[ 'star-icon' ] } ) => (
	<IconWrapper className={ className } size={ size }>
		<Path d="M12 2l2.582 6.953L22 9.257l-5.822 4.602L18.18 21 12 16.89 5.82 21l2.002-7.14L2 9.256l7.418-.304" />
	</IconWrapper>
);

export const CheckmarkIcon = ( { size, className = styles[ 'checkmark-icon' ] } ) => (
	<IconWrapper className={ className } size={ size }>
		<Path d="M11 17.768l-4.884-4.884 1.768-1.768L11 14.232l8.658-8.658C17.823 3.39 15.075 2 12 2 6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-1.528-.353-2.97-.966-4.266L11 17.768z" />
	</IconWrapper>
);

export const JetpackIcon = ( { size, className = styles.jetpack } ) => {
	return (
		<IconWrapper className={ className } size={ size } viewBox="0 0 32 32">
			<Path
				className="jetpack-logo__icon-circle"
				d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z"
			/>
			<Polygon fill="#fff" points="15,19 7,19 15,3" />
			<Polygon fill="#fff" points="17,29 17,13 25,13" />
		</IconWrapper>
	);
};

const iconsMap = {
	'anti-spam': AntiSpamIcon,
	backup: BackupIcon,
	boost: BoostIcon,
	crm: CrmIcon,
	extras: ExtrasIcon,
	protect: ProtectIcon,
	scan: ScanIcon,
	search: SearchIcon,
	star: StarIcon,
	videopress: VideopressIcon,
	jetpack: JetpackIcon,
};

/**
 * Return icon component by slug.
 *
 * @param {string} slug       - Icon slug.
 * @returns {React.Component}   Icon component.
 */
export function getIconBySlug( slug ) {
	if ( ! iconsMap[ slug ] ) {
		return null;
	}

	return iconsMap[ slug ];
}
