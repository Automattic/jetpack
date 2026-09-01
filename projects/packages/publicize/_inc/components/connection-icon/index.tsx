import { SocialServiceIcon } from '@automattic/jetpack-components';
import { useCallback, useState } from '@wordpress/element';
import clsx from 'clsx';
import styles from './styles.module.scss';

// Default avatar fallback — inlined so the chassis esbuild pipeline
// (which doesn't configure a file loader for .svg) can bundle this
// component alongside its legacy webpack consumers.
const DefaultAvatar = ( { alt }: { alt: string } ) => (
	<svg
		className={ styles.avatar }
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 340 340"
		width="24"
		height="24"
		fill="#DDD"
		role="img"
		aria-label={ alt }
	>
		<path d="m169,.5a169,169 0 1,0 2,0zm0,86a76,76 0 1 1-2,0zM57,287q27-35 67-35h92q40,0 67,35a164,164 0 0,1-226,0" />
	</svg>
);

export type ConnectionIconProps = {
	serviceName?: string;
	label: string;
	profilePicture: string;
	disabled?: boolean;
	className?: string;
	// Visual size of the avatar + overlapping service icon. `small` (default)
	// is 28×28 avatar + 14×14 service icon for compact rows / dataviews;
	// `medium` is 32×32 avatar + 16×16 service icon for roomier rows such as
	// the chassis Overview "Connected accounts" list.
	size?: 'small' | 'medium';
};

/**
 * The component to render a social media connection icon.
 * @param {ConnectionIconProps} props - Component props.
 * @return React element
 */
export function ConnectionIcon( {
	label,
	serviceName,
	profilePicture,
	disabled,
	className,
	size = 'small',
}: ConnectionIconProps ) {
	const [ imageErrorFor, setImageErrorFor ] = useState( null );

	const onError = useCallback( () => setImageErrorFor( profilePicture ), [ profilePicture ] );

	const useDefaultAvatar = ! profilePicture || imageErrorFor === profilePicture;

	const service_name = (
		'instagram-business' === serviceName ? 'instagram' : serviceName
	) as React.ComponentProps< typeof SocialServiceIcon >[ 'serviceName' ];

	return (
		<div
			className={ clsx(
				styles.wrapper,
				styles[ size ],
				{
					[ styles.disabled ]: disabled,
				},
				className
			) }
		>
			{ useDefaultAvatar ? (
				<DefaultAvatar alt={ label } />
			) : (
				<img src={ profilePicture } alt={ label } onError={ onError } />
			) }
			{ service_name ? (
				<SocialServiceIcon serviceName={ service_name } className={ styles[ 'social-icon' ] } />
			) : null }
		</div>
	);
}

export default ConnectionIcon;
