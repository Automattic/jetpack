import { __ } from '@wordpress/i18n';
import { SVG, Path, SVGProps } from '@wordpress/primitives';

const HostingerReachIcon = ( props: SVGProps & { width?: number; height?: number } ) => (
	<SVG
		{ ...props }
		width={ props.width || 30 }
		height={ props.height || 30 }
		viewBox="7.002 8.287 148.203 175.426"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label={ __( 'Hostinger Reach icon', 'jetpack-forms' ) }
	>
		<Path
			d="m7.002 8.287 39.319 21.172v39.32h57.467l36.295 21.172h-133.081zm148.203 75.615v-54.443l-42.344-21.172v51.418zm0 99.811-39.319-21.172v-39.32h-57.467l-36.295-21.172h133.081zm-148.203-75.615v54.443l42.343 21.172v-51.418z"
			fill="#6747c7"
			fillRule="evenodd"
			clipRule="evenodd"
		/>
	</SVG>
);

export default HostingerReachIcon;
