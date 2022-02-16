/**
 * External dependencies
 */
import React from 'react';
import { Path, SVG, Circle, Rect, G } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * Icon Wrapper component.
 *
 * @param {object} props           - Component props.
 * @param {number} props.size      - Icon size.
 * @param {string} props.viewBox   - Icon viewBox.
 * @param {object} props.children  - Icon component children.
 * @param {string} props.className - Icon class name. Optional.
 * @returns {object}                 Icon Wrapper component.
 */
function IconWrapper( { className, size = 20, viewBox = '0 0 14 19', children } ) {
	return (
		<SVG
			className={ className }
			width={ size }
			height={ size }
			viewBox={ viewBox }
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			{ children }
		</SVG>
	);
}

export const AntiSpamIcon = ( { size } ) => (
	<IconWrapper size={ size } viewBox="0 0 14 19">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M3.45474 18.2069L11.4547 0.706896L10.5453 0.291138L9.2837 3.05081C8.59914 2.69873 7.82278 2.49999 7 2.49999C5.93853 2.49999 4.95431 2.83076 4.1448 3.39485L2.18994 1.44L1.12928 2.50066L3.05556 4.42694C2.49044 5.15127 2.12047 6.0353 2.02469 6.99999H0V8.49999H2V9.99999H0V11.5H2.10002C2.35089 12.7359 3.0576 13.8062 4.03703 14.5279L2.54526 17.7911L3.45474 18.2069ZM4.68024 13.1209C3.95633 12.4796 3.5 11.5431 3.5 10.5V7.49999C3.5 5.567 5.067 3.99999 7 3.99999C7.60028 3.99999 8.16526 4.15111 8.65898 4.41738L4.68024 13.1209ZM10.3555 6.50155L11.1645 4.73191C11.6053 5.39383 11.8926 6.16683 11.9753 6.99999H14V8.49999H12V9.99999H14V11.5H11.9C11.4367 13.7822 9.41896 15.5 7 15.5C6.75078 15.5 6.50582 15.4818 6.26638 15.4466L6.92799 13.9993C6.95194 13.9998 6.97594 14 7 14C8.933 14 10.5 12.433 10.5 10.5V7.49999C10.5 7.15307 10.4495 6.81794 10.3555 6.50155Z"
			fill="#1E1E1E"
		/>
	</IconWrapper>
);

export const BackupIcon = ( { size } ) => (
	<IconWrapper size={ size } viewBox="0 0 22 16">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="m16.092 8.1635 0.0188-1.7025 1e-4 -0.03867c0-1.9752-1.8025-3.8666-4.4-3.8666-2.1696 0-3.828 1.3518-4.2735 2.9432l-0.42657 1.5238-1.581-0.06466c-0.0393-0.0016-0.07893-0.0024-0.11886-0.0024-1.587 0-2.9778 1.3444-2.9778 3.1333 0 1.7871 1.3878 3.1305 2.9728 3.1334l0.02863-2e-4h12.052l0.0123 2e-4c1.1943 0 2.2667-1.0162 2.2667-2.4 0-1.2351-0.8646-2.1899-1.8964-2.3684l-1.6776-0.2904zm-10.581-3.2038c-0.06651-0.00271-0.13335-0.00408-0.2005-0.00408-2.7492 0-4.9778 2.2983-4.9778 5.1333 0 2.8351 2.2286 5.1334 4.9778 5.1334l0.02962-2e-4h12.035l0.0236 2e-4c2.3564 0 4.2667-1.97 4.2667-4.4 0-2.1802-1.5375-3.99-3.5554-4.3392l3e-4 -0.0608c0-3.24-2.8653-5.8666-6.4-5.8666-2.9837 0-5.4905 1.8716-6.1994 4.404z"
			fill="#1E1E1E"
		/>
	</IconWrapper>
);

export const BoostIcon = ( { size } ) => (
	<IconWrapper size={ size } viewBox="0 0 14 14">
		<Path d="M7 1.5L12 7L7 12.5M1 1.5L6 7L1 12.5" stroke="#1E1E1E" strokeWidth="1.5" />
	</IconWrapper>
);

export const CrmIcon = ( { size } ) => (
	<IconWrapper size={ size } viewBox="0 0 18 11">
		<Path
			d="M9.5 11L9.5 9C9.5 7.89543 8.60457 7 7.5 7L3.5 7C2.39543 7 1.5 7.89543 1.5 9L1.5 11"
			stroke="#1E1E1E"
			strokeWidth="1.5"
		/>
		<Path d="M16.5 11V9C16.5 7.89543 15.6046 7 14.5 7L12 7" stroke="#1E1E1E" strokeWidth="1.5" />
		<Circle cx="12.5" cy="2.5" r="1.75" stroke="#1E1E1E" strokeWidth="1.5" />
		<Circle cx="5.5" cy="2.5" r="1.75" stroke="#1E1E1E" strokeWidth="1.5" />
	</IconWrapper>
);

export const ExtrasIcon = ( { size } ) => (
	<IconWrapper size={ size } viewBox="0 0 19 19">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M14.5 4.5V7H16V4.5H18.5V3H16V0.5H14.5V3H12V4.5H14.5ZM8 3H2C0.895431 3 0 3.89543 0 5V17C0 18.1046 0.895431 19 2 19H14C15.1046 19 16 18.1046 16 17V11H14.5V17C14.5 17.2761 14.2761 17.5 14 17.5H2C1.72386 17.5 1.5 17.2761 1.5 17V5C1.5 4.72386 1.72386 4.5 2 4.5H8V3Z"
			fill="#1E1E1E"
		/>
	</IconWrapper>
);

export const ScanIcon = ( { size } ) => (
	<IconWrapper size={ size } viewBox="0 0 14 17">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M7 0.176147L13.75 3.24433V7.81817C13.75 11.7171 11.2458 15.4088 7.7147 16.5734C7.25069 16.7264 6.74931 16.7264 6.2853 16.5734C2.75416 15.4088 0.25 11.7171 0.25 7.81817V3.24433L7 0.176147ZM1.75 4.2102V7.81817C1.75 11.1311 3.89514 14.2056 6.75512 15.1488C6.914 15.2012 7.086 15.2012 7.24488 15.1488C10.1049 14.2056 12.25 11.1311 12.25 7.81817V4.2102L7 1.82384L1.75 4.2102Z"
			fill="#2C3338"
		/>
	</IconWrapper>
);

export const SearchIcon = ( { size } ) => (
	<IconWrapper size={ size } viewBox="0 0 14 13">
		<Path d="M1 12L5 8.5" stroke="#1E1E1E" strokeWidth="1.5" />
		<Circle cx="8.5" cy="5.5" r="4.75" stroke="#1E1E1E" strokeWidth="1.5" />
	</IconWrapper>
);

export const VideopressIcon = ( { size } ) => (
	<IconWrapper size={ size } viewBox="0 0 18 18">
		<Rect
			x="0.75"
			y="0.75"
			width="16.5"
			height="16.5"
			rx="1.53571"
			stroke="#1E1E1E"
			strokeWidth="1.5"
		/>
		<Path d="M7 12V6L12 9L7 12Z" fill="#1E1E1E" />
	</IconWrapper>
);

export const StarIcon = ( { size, className = styles[ 'star-icon' ] } ) => (
	<IconWrapper className={ className } size={ size } viewBox="0 0 24 24">
		<Path d="M12 2l2.582 6.953L22 9.257l-5.822 4.602L18.18 21 12 16.89 5.82 21l2.002-7.14L2 9.256l7.418-.304" />
	</IconWrapper>
);

export const CheckmarkIcon = ( { size, className = styles[ 'checkmark-icon' ] } ) => (
	<IconWrapper className={ className } size={ size } viewBox="0 0 24 24">
		<G>
			<Path d="M11 17.768l-4.884-4.884 1.768-1.768L11 14.232l8.658-8.658C17.823 3.39 15.075 2 12 2 6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-1.528-.353-2.97-.966-4.266L11 17.768z" />
		</G>
	</IconWrapper>
);

const iconsMap = {
	'anti-spam': AntiSpamIcon,
	backup: BackupIcon,
	boost: BoostIcon,
	crm: CrmIcon,
	extras: ExtrasIcon,
	scan: ScanIcon,
	search: SearchIcon,
	star: StarIcon,
	videopress: VideopressIcon,
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
