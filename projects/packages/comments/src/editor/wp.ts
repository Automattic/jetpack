import * as blockEditor from '@wordpress/block-editor';
import * as blocks from '@wordpress/blocks';
import * as components from '@wordpress/components';
import * as data from '@wordpress/data';
import * as element from '@wordpress/element';
import * as hooks from '@wordpress/hooks';
import * as i18n from '@wordpress/i18n';
import * as richText from '@wordpress/rich-text';

// The bundle has no externals, so a host's block must be registered against these copies, not core's wp.*.
export const wp = { blocks, blockEditor, components, element, richText, hooks, data, i18n };
