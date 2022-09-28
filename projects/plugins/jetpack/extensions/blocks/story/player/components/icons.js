import { Path } from '@wordpress/components';
import renderMaterialIcon from '../../../../shared/render-material-icon';

const MaterialIcon = ( { children, size } ) => renderMaterialIcon( children, size, size );

export const PlayIcon = ( { size } ) => (
	<MaterialIcon size={ size }>
		<Path d="M8 5v14l11-7z" />
	</MaterialIcon>
);

export const PauseIcon = ( { size } ) => (
	<MaterialIcon size={ size }>
		<Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
	</MaterialIcon>
);

export const ReplayIcon = ( { size } ) => (
	<MaterialIcon size={ size }>
		<Path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
	</MaterialIcon>
);

export const CloseIcon = ( { size } ) => (
	<MaterialIcon size={ size }>
		<Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
	</MaterialIcon>
);

export const VolumeUpIcon = ( { size } ) => (
	<MaterialIcon size={ size }>
		<Path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
	</MaterialIcon>
);

export const VolumeOffIcon = ( { size } ) => (
	<MaterialIcon size={ size }>
		<Path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
	</MaterialIcon>
);

export const NavigateBeforeIcon = ( { size } ) => (
	<MaterialIcon size={ size }>
		<Path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
	</MaterialIcon>
);

export const NavigateNextIcon = ( { size } ) => (
	<MaterialIcon size={ size }>
		<Path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
	</MaterialIcon>
);
