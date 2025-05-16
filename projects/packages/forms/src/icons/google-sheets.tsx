import { SVG, Path, SVGProps } from '@wordpress/primitives';

const GoogleSheetsIcon = ( props: SVGProps ) => (
	<SVG viewBox="0 0 64 88" width={ 24 } height={ 24 } { ...props }>
		<Path
			d="M58,88H6c-3.3,0-6-2.7-6-6V6c0-3.3,2.7-6,6-6h36l22,22v60C64,85.3,61.3,88,58,88z"
			fill="#0F9D58"
		/>
		<Path fill="#FDFFFF" d="M42,0l22,22H42V0z" />
		<Path
			fill="#FDFFFF"
			d="M12,34.5v28h40v-28H12z M17,39.5h12.5V46H17V39.5z M17,51h12.5v6.5H17V51z M47,57.5H34.5V51H47V57.5z M47,46 H34.5v-6.5H47V46z"
		/>
	</SVG>
);

export default GoogleSheetsIcon;
