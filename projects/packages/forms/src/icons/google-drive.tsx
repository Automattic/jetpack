import { SVG, Polygon, SVGProps } from '@wordpress/primitives';

const GoogleDriveIcon = ( props: SVGProps ) => (
	<SVG width={ 28 } height={ 28 } viewBox="0 0 28 28" fill="none" { ...props }>
		<Polygon points="14,3 27,25 1,25" fill="#34A853" />
		<Polygon points="14,3 27,25 14,25" fill="#4285F4" />
		<Polygon points="1,25 14,25 7.5,14" fill="#FBBC05" />
	</SVG>
);

export default GoogleDriveIcon;
