/**
 * External dependencies
 */
import { Warning } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './editor.scss';

const withCoreEmbedVideoPressBlock = createHigherOrderComponent( CoreEmbedBlockEdit => {
	return props => {
		if ( props.name !== 'core/embed' ) {
			return <CoreEmbedBlockEdit { ...props } />;
		}

		const { attributes } = props;
		if ( ! attributes?.providerNameSlug || attributes.providerNameSlug !== 'videopress' ) {
			return <CoreEmbedBlockEdit { ...props } />;
		}

		const { keepUsingOEmbedVariation } = attributes;
		if ( keepUsingOEmbedVariation === true ) {
			return <CoreEmbedBlockEdit { ...props } />;
		}

		return (
			<div>
				<Warning
					className="videopress-embed-warning"
					actions={ [
						<Button key="convert" variant="primary">
							{ __( 'Use the new VideoPress Video block', 'jetpack-videopress-pkg' ) }
						</Button>,
						<Button key="convert" variant="tertiary">
							{ __( 'Keep using the VideoPress Embed block variation', 'jetpack-videopress-pkg' ) }
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
