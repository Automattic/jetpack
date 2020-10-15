/**
 * External dependencies
 */
import { G, Icon, Path, Polygon, Rect, SVG } from '@wordpress/components';
import classNames from 'classnames';
import { colors as PALETTE } from '@automattic/color-studio';

/**
 * Internal dependencies
 */
import './icons.scss';
import { getIconColor } from './block-icons';

/**
 * Constants
 */
const COLOR_JETPACK = PALETTE[ 'Jetpack Green 40' ];

export const MediaLibraryIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="m19 5v14h-14v-14h14m0-2h-14c-1.1 0-2 0.9-2 2v14c0 1.1 0.9 2 2 2h14c1.1 0 2-0.9 2-2v-14c0-1.1-0.9-2-2-2z" />
		<Path d="m14.14 11.86l-3 3.87-2.14-2.59-3 3.86h12l-3.86-5.14z" />
	</SVG>
);

export const GooglePhotosIcon = props => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" { ...props }>
		<Path d="M6.3 7l-4.4 4.5c0 .1-.1.2-.1.3-.1.1 0 .2.2.2h7c1.1 0 2-.9 2-2V7H6.3zM22 12h-7c-1.1 0-2 .9-2 2v3h4.7l4.4-4.5c0-.1.1-.2.1-.3.1-.1 0-.2-.2-.2zM12.5 1.9c-.1 0-.2-.1-.3-.1-.1-.1-.2 0-.2.2v7c0 1.1.9 2 2 2h3V6.3l-4.5-4.4zM10 13H7v4.7l4.5 4.4c.1 0 .2.1.3.1.2 0 .3-.1.3-.3v-7c-.1-1-1-1.9-2.1-1.9z" />
	</SVG>
);

export const PexelsIcon = props => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" { ...props }>
		<Path d="M14 7H9v10h3.9v-3.8H14c1.7 0 3.1-1.4 3.1-3.1C17.2 8.4 15.8 7 14 7z" />
		<Path d="M20.5 2h-17C2.7 2 2 2.7 2 3.5v17c0 .8.7 1.5 1.5 1.5h17c.8 0 1.5-.7 1.5-1.5v-17c0-.8-.7-1.5-1.5-1.5zm-5.6 13.2V19H7V5h7c2.8 0 5.1 2.3 5.1 5.1.1 2.5-1.8 4.7-4.2 5.1z" />
	</SVG>
);

export const GooglePhotosLogo = () => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		width="128"
		height="128"
		viewBox="135.688 36.52 511.623 510.753"
	>
		<Path
			fill="#DD4B39"
			stroke="#DD4B39"
			d="M391.6 36.6c1.4.8 2.6 2 3.7 3.2 41.3 41.5 82.7 83 123.899 124.6-26 25.6-51.6 51.6-77.399 77.3-9.7 9.8-19.601 19.4-29.2 29.4-7.2-17.4-14.1-34.9-21-52.4 0-18.2.1-36.4 0-54.7-.1-42.4-.2-84.9 0-127.4z"
		/>
		<Path
			fill="#EF851C"
			stroke="#EF851C"
			d="M263.5 164h128.1c.1 18.3 0 36.5 0 54.7-7.1 17.2-14 34.5-20.8 51.9-2.2-1.2-3.8-3-5.5-4.8L263.9 164.4l-.4-.4z"
		/>
		<Path
			fill="#7E3794"
			stroke="#7E3794"
			d="M519.199 164.4l.4-.3c-.1 42.6-.1 85.3 0 127.9h-55.1c-17.2-7.2-34.601-13.8-51.9-20.9 9.6-10 19.5-19.6 29.2-29.4 25.801-25.7 51.4-51.7 77.4-77.3z"
		/>
		<Path
			fill="#FFBB1B"
			stroke="#FFBB1B"
			d="M242.6 185.5c7.2-6.9 13.9-14.3 21.3-21.1l101.4 101.4c1.7 1.8 3.3 3.6 5.5 4.8-2.3 1.7-5.2 2.3-7.8 3.5-14.801 6-29.801 11.6-44.5 18-18.301-.2-36.601-.1-54.9-.1-42.6-.1-85.2.2-127.8-.1 35.5-35.6 71.2-71 106.8-106.4z"
		/>
		<Path
			fill="#1A8763"
			stroke="#1A8763"
			d="M263.6 292c18.3 0 36.6-.1 54.9.1 17.3 7.1 34.6 13.8 51.899 20.8C342 341.7 313.3 370.1 284.8 398.8c-7.2 6.8-13.7 14.3-21.3 20.7 0-42.5-.1-85 .1-127.5z"
		/>
		<Path
			fill="#427FED"
			stroke="#427FED"
			d="M464.5 292h55.1c42.5.1 85.1-.1 127.6.1-27.3 27.7-55 55.1-82.399 82.6-15.2 15.1-30.2 30.399-45.4 45.3-34-34.4-68.5-68.4-102.6-102.8-1.4-1.5-2.9-2.8-4.601-3.8 2.9-1.801 6.101-2.7 9.2-4 14.4-5.8 28.799-11.4 43.1-17.4z"
		/>
		<Path
			fill="#65B045"
			stroke="#65B045"
			d="M370.4 312.9c7.3 17.399 13.9 35 21.2 52.399-.1 18.2 0 36.5-.1 54.7v88c-.2 13.1.3 26.2-.2 39.2-2.101-1-3.4-2.9-5.101-4.5C345.3 501.6 304.5 460.5 263.5 419.5c7.6-6.4 14.1-13.9 21.3-20.7 28.5-28.7 57.2-57.1 85.6-85.9z"
		/>
		<Path
			fill="#43459D"
			stroke="#43459D"
			d="M412.199 313.4c1.7 1 3.2 2.3 4.601 3.8 34.1 34.4 68.6 68.4 102.6 102.8-42.7-.1-85.3.1-127.899 0 .1-18.2 0-36.5.1-54.7 6.699-17.3 13.899-34.5 20.598-51.9z"
		/>
	</SVG>
);

export const JetpackLogo = ( { size = 24, className } ) => (
	<SVG
		className={ classNames( 'jetpack-logo', className ) }
		width={ size }
		height={ size }
		viewBox="0 0 32 32"
	>
		<Path
			className="jetpack-logo__icon-circle"
			fill={ COLOR_JETPACK }
			d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z"
		/>
		<Polygon className="jetpack-logo__icon-triangle" fill="#fff" points="15,19 7,19 15,3 " />
		<Polygon className="jetpack-logo__icon-triangle" fill="#fff" points="17,29 17,13 25,13 " />
	</SVG>
);

// @TODO: Import those from https://github.com/Automattic/social-logos when that's possible.
// Currently we can't directly import icons from there, because all icons are bundled in a single file.
// This means that to import an icon from there, we'll need to add the entire bundle with all icons to our build.
// In the future we'd want to export each icon in that repo separately, and then import them separately here.
const FacebookIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="M20.007 3H3.993C3.445 3 3 3.445 3 3.993v16.013c0 .55.445.994.993.994h8.62v-6.97H10.27V11.31h2.346V9.31c0-2.325 1.42-3.59 3.494-3.59.993 0 1.847.073 2.096.106v2.43h-1.438c-1.128 0-1.346.537-1.346 1.324v1.734h2.69l-.35 2.717h-2.34V21h4.587c.548 0 .993-.445.993-.993V3.993c0-.548-.445-.993-.993-.993z" />
		</G>
	</SVG>
);
const TwitterIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="M22.23 5.924c-.736.326-1.527.547-2.357.646.847-.508 1.498-1.312 1.804-2.27-.793.47-1.67.812-2.606.996C18.325 4.498 17.258 4 16.078 4c-2.266 0-4.103 1.837-4.103 4.103 0 .322.036.635.106.935-3.41-.17-6.433-1.804-8.457-4.287-.353.607-.556 1.312-.556 2.064 0 1.424.724 2.68 1.825 3.415-.673-.022-1.305-.207-1.86-.514v.052c0 1.988 1.415 3.647 3.293 4.023-.344.095-.707.145-1.08.145-.265 0-.522-.026-.773-.074.522 1.63 2.038 2.817 3.833 2.85-1.404 1.1-3.174 1.757-5.096 1.757-.332 0-.66-.02-.98-.057 1.816 1.164 3.973 1.843 6.29 1.843 7.547 0 11.675-6.252 11.675-11.675 0-.178-.004-.355-.012-.53.802-.578 1.497-1.3 2.047-2.124z" />
		</G>
	</SVG>
);
const LinkedinIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="M19.7 3H4.3C3.582 3 3 3.582 3 4.3v15.4c0 .718.582 1.3 1.3 1.3h15.4c.718 0 1.3-.582 1.3-1.3V4.3c0-.718-.582-1.3-1.3-1.3zM8.34 18.338H5.666v-8.59H8.34v8.59zM7.003 8.574c-.857 0-1.55-.694-1.55-1.548 0-.855.692-1.548 1.55-1.548.854 0 1.547.694 1.547 1.548 0 .855-.692 1.548-1.546 1.548zm11.335 9.764h-2.67V14.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.6 1.086-1.6 2.206v4.248h-2.668v-8.59h2.56v1.174h.036c.357-.675 1.228-1.387 2.527-1.387 2.703 0 3.203 1.78 3.203 4.092v4.71z" />
		</G>
	</SVG>
);
const TumblrIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="M19 3H5c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zm-5.57 14.265c-2.445.042-3.37-1.742-3.37-2.998V10.6H8.922V9.15c1.703-.615 2.113-2.15 2.21-3.026.006-.06.053-.084.08-.084h1.645V8.9h2.246v1.7H12.85v3.495c.008.476.182 1.13 1.08 1.107.3-.008.698-.094.907-.194l.54 1.6c-.205.297-1.12.642-1.946.657z" />
		</G>
	</SVG>
);
const GoogleIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<G>
			<Path d="M12.02 10.18v3.73h5.51c-.26 1.57-1.67 4.22-5.5 4.22-3.31 0-6.01-2.75-6.01-6.12s2.7-6.12 6.01-6.12c1.87 0 3.13.8 3.85 1.48l2.84-2.76C16.99 2.99 14.73 2 12.03 2c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.83-.11-1.42-.25-2.05h-9.36z" />
		</G>
	</SVG>
);

export const LoomIcon = {
	foreground: getIconColor(),
	src: (
		<SVG viewBox="0 0 100 100">
			<Path d="M100,44H72.4l23.9-13.8l-6-10.4L66.4,33.6L80.2,9.7l-10.4-6L56,27.59V0H44v27.6L30.2,3.7l-10.4,6l13.8,23.9 L9.7,19.8l-6,10.4L27.6,44H0V56h27.6L3.7,69.8l6,10.4l23.9-13.8L19.8,90.3l10.4,6L44,72.4V100H56V72.41l13.8,23.9l10.4-6L66.4,66.4 l23.9,13.8l6-10.4L72.4,56H100V44z M50,65.23c-8.41,0-15.23-6.82-15.23-15.23c0-8.41,6.82-15.23,15.23-15.23S65.23,41.59,65.23,50 C65.23,58.41,58.41,65.23,50,65.23z" />
		</SVG>
	),
};

export const SocialServiceIcon = ( { serviceName, className } ) => {
	const defaultProps = {
		className: classNames( 'jetpack-gutenberg-social-icon', `is-${ serviceName }`, className ),
		size: 24,
	};

	switch ( serviceName ) {
		case 'facebook':
			return <Icon icon={ FacebookIcon } { ...defaultProps } />;
		case 'twitter':
			return <Icon icon={ TwitterIcon } { ...defaultProps } />;
		case 'linkedin':
			return <Icon icon={ LinkedinIcon } { ...defaultProps } />;
		case 'tumblr':
			return <Icon icon={ TumblrIcon } { ...defaultProps } />;
		case 'google':
			return <Icon icon={ GoogleIcon } { ...defaultProps } />;
	}

	return null;
};
