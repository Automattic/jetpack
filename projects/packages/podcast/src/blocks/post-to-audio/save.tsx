/**
 * The Post to Audio block is a transient editor-only authoring surface: on a
 * successful generation it replaces itself with a `core/audio` block, so it is
 * never meant to persist in post content. Saving `null` keeps it out of the
 * serialized markup (and avoids a block-validation deprecation liability if the
 * placeholder markup ever changes).
 */
export default function save() {
	return null;
}
