/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import { Icon } from '@wordpress/components';
import {
	blockTable,
	brush,
	file,
	image,
	pages,
	plugins,
	preformatted,
	typography,
	video,
	wordpress,
} from '@wordpress/icons';
import type { FileType } from '../../../data/types';

interface FileTypeIconProps {
	type: FileType;
}

const fileTypeToIcon: Record< FileType, JSX.Element > = {
	dir: file,
	image: image,
	text: preformatted,
	plugin: plugins,
	theme: brush,
	table: blockTable,
	audio: video,
	video: video,
	fonts: typography,
	translations: pages,
	code: pages,
	wordpress: wordpress,
	other: pages,
	archive: file,
};

/**
 *
 * @param root0
 * @param root0.type
 */
function FileTypeIcon( { type }: FileTypeIconProps ) {
	const icon = fileTypeToIcon[ type ] || pages;
	return <Icon icon={ icon } />;
}

export default FileTypeIcon;
