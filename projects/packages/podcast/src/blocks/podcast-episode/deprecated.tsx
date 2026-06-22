import { useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';
import metadata from './block.json';

interface DeprecatedSaveProps {
	attributes: {
		mediaUrl?: string;
	};
}

/**
 * v1 — original save output.
 *
 * The block originally persisted only a bare direct link to the media file and
 * leaned entirely on the dynamic PHP render callback to build the player on the
 * front end, which left the Reader, RSS, and email with just a link. The
 * current `save` emits a full static player, so this deprecation lets posts
 * saved with the old markup re-parse without tripping block validation. The
 * attributes are unchanged, so no `migrate` is needed.
 *
 * @param props            - Block save props.
 * @param props.attributes - Block attributes.
 * @return The original serialized markup, or null when there is no media.
 */
function save( { attributes }: DeprecatedSaveProps ) {
	const { mediaUrl } = attributes;
	if ( ! mediaUrl ) {
		return null;
	}

	const blockProps = useBlockProps.save();
	return (
		<a
			{ ...blockProps }
			className={ clsx( blockProps.className, 'jetpack-podcast-episode__direct-link' ) }
			href={ mediaUrl }
		>
			{ mediaUrl }
		</a>
	);
}

export default [
	{
		attributes: metadata.attributes,
		supports: metadata.supports,
		save,
	},
];
