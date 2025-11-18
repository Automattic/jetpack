import { SocialServiceIcon } from '@automattic/jetpack-components';
import { useCallback, useState } from '@wordpress/element';
import clsx from 'clsx';
import { Connection } from '../../social-store/types';
import styles from './styles.module.scss';

export type ConnectionImageProps = Pick<
	Connection,
	'service_name' | 'display_name' | 'profile_picture'
> & {
	disabled?: boolean;
};

/**
 * The component to render a social media connection icon.
 * @param {ConnectionImageProps} props - Component props.
 * @return React element
 */
export function ConnectionImage( {
	service_name,
	display_name,
	profile_picture,
	disabled,
}: ConnectionImageProps ) {
	const [ imageErrorFor, setImageErrorFor ] = useState( null );

	const onError = useCallback( () => setImageErrorFor( profile_picture ), [ profile_picture ] );

	const hasDisplayPicture = !! profile_picture && imageErrorFor !== profile_picture;

	const serviceName = (
		'instagram-business' === service_name ? 'instagram' : service_name
	) as React.ComponentProps< typeof SocialServiceIcon >[ 'serviceName' ];

	return (
		<div
			className={ clsx( styles.wrapper, {
				[ styles[ 'has-picture' ] ]: hasDisplayPicture,
				[ styles.disabled ]: disabled,
			} ) }
		>
			{ hasDisplayPicture && (
				<img src={ profile_picture } alt={ display_name } onError={ onError } />
			) }
			<SocialServiceIcon serviceName={ serviceName } className={ styles[ 'social-icon' ] } />
		</div>
	);
}
