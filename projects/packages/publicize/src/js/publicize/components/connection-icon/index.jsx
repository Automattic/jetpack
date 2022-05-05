/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icon, SVG, Rect, G, Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
// @TODO: Import those from https://github.com/Automattic/social-logos when that's possible.
// Currently we can't directly import icons from there, because all icons are bundled in a single file.
// This means that to import an icon from there, we'll need to add the entire bundle with all icons to our build.
// In the future we'd want to export each icon in that repo separately, and then import them separately here.
const FacebookIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path
				d="M12,2C6.5,2,2,6.5,2,12c0,5,3.7,9.1,8.4,9.9v-7H7.9V12h2.5V9.8c0-2.5,1.5-3.9,3.8-3.9c1.1,0,2.2,0.2,2.2,0.2v2.5h-1.3
	c-1.2,0-1.6,0.8-1.6,1.6V12h2.8l-0.4,2.9h-2.3v7C18.3,21.1,22,17,22,12C22,6.5,17.5,2,12,2z"
			/>
		</G>
	</SVG>
);
const TwitterIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path
				d="M19,3H5C3.895,3,3,3.895,3,5v14c0,1.105,0.895,2,2,2h14c1.105,0,2-0.895,2-2V5C21,3.895,20.105,3,19,3z M16.466,9.71
		c0.004,0.099,0.007,0.198,0.007,0.298c0,3.045-2.318,6.556-6.556,6.556c-1.301,0-2.512-0.381-3.532-1.035
		c0.18,0.021,0.364,0.032,0.55,0.032c1.079,0,2.073-0.368,2.862-0.986c-1.008-0.019-1.859-0.685-2.152-1.6
		c0.141,0.027,0.285,0.041,0.433,0.041c0.21,0,0.414-0.028,0.607-0.081c-1.054-0.212-1.848-1.143-1.848-2.259
		c0-0.01,0-0.019,0-0.029c0.311,0.173,0.666,0.276,1.044,0.288c-0.618-0.413-1.025-1.118-1.025-1.918
		c0-0.422,0.114-0.818,0.312-1.158c1.136,1.394,2.834,2.311,4.749,2.407c-0.039-0.169-0.06-0.344-0.06-0.525
		c0-1.272,1.032-2.304,2.304-2.304c0.663,0,1.261,0.28,1.682,0.728c0.525-0.103,1.018-0.295,1.463-0.559
		c-0.172,0.538-0.537,0.99-1.013,1.275c0.466-0.056,0.91-0.18,1.323-0.363C17.306,8.979,16.916,9.385,16.466,9.71z"
			/>
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
const SocialServiceIcon = ( { serviceName, className } ) => {
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

/**
 * Style dependencies
 */
import './style.scss';

const ConnectionIcon = props => {
	const { id, serviceName, label, profilePicture } = props;

	return (
		<label htmlFor={ id } className="jetpack-publicize-connection-label">
			<div className={ profilePicture ? 'components-connection-icon__picture' : '' }>
				{ profilePicture && <img src={ profilePicture } alt={ label } /> }
				<SocialServiceIcon
					serviceName={ serviceName }
					className="jetpack-publicize-gutenberg-social-icon"
				/>
			</div>
			<span className="jetpack-publicize-connection-label-copy">{ label }</span>
		</label>
	);
};

ConnectionIcon.propTypes = {
	id: PropTypes.string.isRequired,
	serviceName: PropTypes.string,
	label: PropTypes.string,
	profilePicture: PropTypes.string,
};

export default ConnectionIcon;
