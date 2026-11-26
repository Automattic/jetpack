import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import type { ShareImage } from '../../data/settings-types';

interface MediaFrame {
	on: ( event: string, callback: () => void ) => void;
	open: () => void;
	state: () => {
		get: ( key: string ) => {
			first: () => { toJSON: () => { id: number; url: string; alt?: string } } | undefined;
		};
	};
}

interface Props {
	image?: ShareImage | null;
	disabled?: boolean;
	onChange: ( image: ShareImage | null ) => void;
}

/**
 * Select or clear the image used when a share has no content-specific image.
 *
 * @param props - Field properties.
 * @return The Media Library picker and current image.
 */
export default function ShareImageField( props: Props ) {
	const { image, disabled, onChange } = props;
	const [ error, setError ] = useState( '' );
	const choose = useCallback( () => {
		setError( '' );
		const media = ( window as unknown as { wp?: { media?: ( options: object ) => MediaFrame } } ).wp
			?.media;
		if ( ! media ) {
			setError(
				__( 'The Media Library is unavailable. Reload this page and try again.', 'jetpack-seo' )
			);
			return;
		}
		const frame = media( {
			title: __( 'Default share image', 'jetpack-seo' ),
			button: { text: __( 'Use image', 'jetpack-seo' ) },
			multiple: false,
			library: { type: [ 'image/jpeg', 'image/png', 'image/gif', 'image/webp' ] },
		} );
		frame.on( 'select', () => {
			const attachment = frame.state().get( 'selection' ).first()?.toJSON();
			if ( attachment ) {
				onChange( { id: attachment.id, src: attachment.url, alt_text: attachment.alt ?? '' } );
			}
		} );
		frame.open();
	}, [ onChange ] );
	const remove = useCallback( () => onChange( null ), [ onChange ] );
	return (
		<Stack direction="column" gap="md" align="start">
			<Text variant="heading-md" render={ <h3 /> }>
				{ __( 'Default share image', 'jetpack-seo' ) }
			</Text>
			{ image && (
				<img
					src={ image.src }
					alt={ image.alt_text || __( 'Current default share image', 'jetpack-seo' ) }
					width={ 300 }
					style={ { maxInlineSize: '100%', blockSize: 'auto' } }
				/>
			) }
			<Text variant="body-md" render={ <p /> }>
				{ __(
					'Used when a page has no content-specific share image. This image will be public when used in a share.',
					'jetpack-seo'
				) }
			</Text>
			<Stack direction="row" gap="sm">
				<Button variant="outline" onClick={ choose } disabled={ disabled }>
					{ image ? __( 'Replace image', 'jetpack-seo' ) : __( 'Choose image', 'jetpack-seo' ) }
				</Button>
				{ image && (
					<Button variant="minimal" onClick={ remove } disabled={ disabled }>
						{ __( 'Remove image', 'jetpack-seo' ) }
					</Button>
				) }
			</Stack>
			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			) }
		</Stack>
	);
}
