/**
 * External dependencies
 */
import { Warning, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './editor.scss';
import { pickGUIDFromUrl } from '../../blocks/video/utils/url';

const withCoreEmbedVideoPressBlock = createHigherOrderComponent( CoreEmbedBlockEdit => {
	return props => {
		const { clientId } = props;
		const { attributes, setAttributes } = props;
		const { url, keepUsingOEmbedVariation } = attributes;
		const { replaceBlock } = useDispatch( blockEditorStore );

		const guid = pickGUIDFromUrl( url );

		useEffect( () => {
			if ( keepUsingOEmbedVariation !== false ) {
				return;
			}

			replaceBlock(
				clientId,
				createBlock( 'videopress/video', {
					...attributes,
					guid,
				} )
			);
		}, [ keepUsingOEmbedVariation, guid ] );

		// Check if the block is a core/embed block.
		if ( props.name !== 'core/embed' ) {
			return <CoreEmbedBlockEdit { ...props } />;
		}

		// ...and if it's a `videopress` variation.
		if ( ! attributes?.providerNameSlug || attributes.providerNameSlug !== 'videopress' ) {
			return <CoreEmbedBlockEdit { ...props } />;
		}

		// ... and if was possible to pick the GUID from the URL.
		if ( ! guid ) {
			return <CoreEmbedBlockEdit { ...props } />;
		}

		// ... and if the user has already decided to keep using the oEmbed variation.
		if ( keepUsingOEmbedVariation === true ) {
			return <CoreEmbedBlockEdit { ...props } />;
		}

		return (
			<div>
				<Warning
					className="videopress-embed-warning"
					actions={ [
						<Button
							key="convert"
							variant="primary"
							onClick={ () => setAttributes( { keepUsingOEmbedVariation: false } ) }
						>
							{ __( 'Use VideoPress Video block', 'jetpack-videopress-pkg' ) }
						</Button>,
						<Button
							key="convert"
							variant="tertiary"
							onClick={ () => setAttributes( { keepUsingOEmbedVariation: true } ) }
						>
							{ __( 'Keep using VideoPress Embed block', 'jetpack-videopress-pkg' ) }
						</Button>,
					] }
				>
					{ __(
						'Your site currently supports the VideoPress Video block.',
						'jetpack-videopress-pkg'
					) }
				</Warning>

				<div className="wp-block-core-embed-wrapper is-disabled">
					<div className="core-embed-videopress-player__overlay" />
					<CoreEmbedBlockEdit { ...props } />
				</div>
			</div>
		);
	};
}, 'withCoreEmbedVideoPressBlock' );

export default withCoreEmbedVideoPressBlock;
