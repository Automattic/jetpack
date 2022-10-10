/**
 * External dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

const withCoreEmbedVideoPressBlock = createHigherOrderComponent( CoreEmbedBlockEdit => {
	return props => {
		if ( props.name !== 'core/embed' ) {
			return <CoreEmbedBlockEdit { ...props } />;
		}

		const { attributes } = props;
		if ( ! attributes?.providerNameSlug || attributes.providerNameSlug !== 'videopress' ) {
			return <CoreEmbedBlockEdit { ...props } />;
		}

		return (
			<>
				<CoreEmbedBlockEdit { ...props } />
			</>
		);
	};
}, 'withCoreEmbedVideoPressBlock' );

export default withCoreEmbedVideoPressBlock;
