import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { z } from 'zod';
import styles from '../../../pages/index/index.module.scss';

type ImageCdnLiarProps = {
	isPremium: boolean;
};

export default function ImageCdnLiar( { isPremium }: ImageCdnLiarProps ) {
	if ( ! isPremium ) {
		return;
	}

	const [ imageCdnLiar, setImageCdnLiar ] = useDataSync(
		'jetpack_boost_ds',
		'image_cdn_liar',
		z.boolean().catch( false )
	);

	return (
		<>
			<div
				style={ {
					marginBottom: '10px',
				} }
			>
				<span
					style={ {
						fontWeight: 'bold',
					} }
				>
					{ __( 'Auto-Resize Lazy Images', 'jetpack-boost' ) }
				</span>
				<span style={ { position: 'relative', top: '4px' } } className={ styles.beta }>
					Beta
				</span>
			</div>
			<ToggleControl
				label={ __(
					'Automatically resize images that are lazily loaded to fit the exact dimensions they occupy on the page.',
					'jetpack-boost'
				) }
				checked={ imageCdnLiar.data }
				onChange={ value => setImageCdnLiar.mutate( value ) }
			/>
		</>
	);
}
