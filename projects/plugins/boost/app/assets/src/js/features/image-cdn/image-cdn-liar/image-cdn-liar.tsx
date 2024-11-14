import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { z } from 'zod';
import styles from './image-cdn-liar.module.scss';
import ModuleSubsection from '$features/ui/module-subsection/module-subsection';
import { recordBoostEvent } from '$lib/utils/analytics';
import Pill from '$features/ui/pill/pill';

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

	const handleToggle = ( value: boolean ) => {
		setImageCdnLiar.mutate( value );

		recordBoostEvent( 'image_cdn_liar_toggle', { enabled: Number( value ) } );
	};

	return (
		<ModuleSubsection>
			<div className={ styles.wrapper }>
				<div className={ styles.title }>
					<h4>
						{ __( 'Auto-Resize Lazy Images', 'jetpack-boost' ) }
						<Pill text="Beta" />
					</h4>
					<ToggleControl
						className={ styles[ 'toggle-control' ] }
						checked={ imageCdnLiar.data }
						onChange={ handleToggle }
						__nextHasNoMarginBottom={ true }
					/>
				</div>
			</div>
			<div className={ styles.description }>
				{ __(
					'Automatically resize images that are lazily loaded to fit the exact dimensions they occupy on the page.',
					'jetpack-boost'
				) }
			</div>
		</ModuleSubsection>
	);
}
