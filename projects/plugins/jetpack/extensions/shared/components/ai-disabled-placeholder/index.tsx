/**
 * External dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';

type Props = {
	label: string;
	instructions: string;
};

/**
 * Editor stand-in for a block that a Jetpack AI setting has switched off.
 *
 * Mirrors the AI Answer block in the Search package: the block stays in the
 * post and explains why it is inert, so authors don't mistake it for broken
 * content. There is no button, since the block cannot know which settings
 * page the current user may open.
 *
 * @param {Props}  props              - Component props.
 * @param {string} props.label        - The block's name, shown as the placeholder title.
 * @param {string} props.instructions - Why the block is off and what turns it back on.
 * @return {JSX.Element} The placeholder.
 */
export default function AiDisabledPlaceholder( { label, instructions }: Props ) {
	return (
		<div { ...useBlockProps() }>
			<Placeholder label={ label } instructions={ instructions } />
		</div>
	);
}
