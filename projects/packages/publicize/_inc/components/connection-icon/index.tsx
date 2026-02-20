import { SocialServiceIcon } from '@automattic/jetpack-components';
import { useCallback, useState } from '@wordpress/element';
import clsx from 'clsx';
import defaultAvatar from './default-avatar.svg';
import styles from './styles.module.scss';

export type ConnectionIconProps = {
	serviceName?: string;
	label: string;
	profilePicture: string;
	disabled?: boolean;
	className?: string;
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
				{
					[ styles.disabled ]: disabled,
				},
				className
			) }
		>
			<img
				src={ useDefaultAvatar ? defaultAvatar : profilePicture }
				alt={ label }
				onError={ onError }
			/>
			{ service_name ? (
				<SocialServiceIcon serviceName={ service_name } className={ styles[ 'social-icon' ] } />
			) : null }
		</div>
	);
}

export default ConnectionIcon;
