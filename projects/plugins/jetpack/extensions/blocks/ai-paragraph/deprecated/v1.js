import { useBlockProps } from '@wordpress/block-editor';
import { pasteHandler } from '@wordpress/blocks';

/**
 * Example data to migrate:
 * ```
 * <!-- wp:paragraph -->
 * <p>GPT generates a block for testing.  This block should be an interesting but somewhat obscure fact regarding pirates and their constant battles with ninjas.</p>
 * <!-- /wp:paragraph -->
 *
 * <!-- wp:jetpack/ai-paragraph {"animationDone":true} -->
 * <div class="wp-block-jetpack-ai-paragraph">Pirates and ninjas shared a common enemy during the Age of Exploration: samurai. Both pirates and ninjas were constantly engaged in a battle of wits to outsmart the samurai and escape their grip. The pirates and ninjas often ended up teaming up in order to evade the samurai, swapping knowledge and resources and even joining forces to achieve greater strength. This was a highly effective strategy, as the samurai were no match for the combined strength of the two groups.</div>
 * <!-- /wp:jetpack/ai-paragraph -->
 * ```
 */
export default {
	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'div',
		},
		animationDone: {
			type: 'boolean',
			default: false,
		},
	},
	save: ( { attributes: { content } } ) => {
		const blockProps = useBlockProps.save();
		return <div { ...blockProps }>{ content }</div>;
	},
	migrate: ( { content } ) => {
		const parsedBlocks = pasteHandler( {
			HTML: '',
			mode: 'BLOCKS',
			plainText: content,
		} );
		return [
			{
				state: 'done',
			},
			parsedBlocks,
		];
	},
};
