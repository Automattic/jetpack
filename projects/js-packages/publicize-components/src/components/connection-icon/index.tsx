import { SocialServiceIcon } from '@automattic/jetpack-components';
import { useCallback, useState } from '@wordpress/element';
import clsx from 'clsx';
import styles from './styles.module.scss';

export type ConnectionIconProps = {
	serviceName: string;
	label: string;
	profilePicture: string;
	disabled?: boolean;
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
}: ConnectionIconProps ) {
	const [ imageErrorFor, setImageErrorFor ] = useState( null );

	const onError = useCallback( () => setImageErrorFor( profilePicture ), [ profilePicture ] );

	const hasDisplayPicture = !! profilePicture && imageErrorFor !== profilePicture;

	const service_name = (
		'instagram-business' === serviceName ? 'instagram' : serviceName
	) as React.ComponentProps< typeof SocialServiceIcon >[ 'serviceName' ];

	return (
		<div
			className={ clsx( styles.wrapper, {
				[ styles[ 'has-picture' ] ]: hasDisplayPicture,
				[ styles.disabled ]: disabled,
			} ) }
		>
			{ hasDisplayPicture && <img src={ profilePicture } alt={ label } onError={ onError } /> }
			<SocialServiceIcon serviceName={ service_name } className={ styles[ 'social-icon' ] } />
		</div>
	);
}

export default ConnectionIcon;
