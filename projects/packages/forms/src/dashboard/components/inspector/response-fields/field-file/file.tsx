/**
 * External dependencies
 */
import { Button, ExternalLink, Icon, Tooltip } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../../../hooks/use-config-value.ts';

const extensionMap: Record< string, string > = {
	pdf: 'pdf',
	png: 'png',
	jpg: 'png',
	jpeg: 'png',
	gif: 'png',
	mp4: 'mp4',
	mp3: 'mp3',
	webm: 'mp4',
	doc: 'doc',
	docx: 'doc',
	txt: 'txt',
	ppt: 'ppt',
	pptx: 'ppt',
	xls: 'xls',
	xlsx: 'xls',
	csv: 'xls',
	zip: 'zip',
	sql: 'sql',
	cal: 'cal',
	html: 'html',
};

const mimeMap: Record< string, string > = {
	image: 'png',
	video: 'mp4',
	audio: 'mp3',
	document: 'pdf',
	application: 'txt',
};

const FieldFile = ( { file, onClick } ) => {
	const fileExtension = file.name.split( '.' ).pop().toLowerCase();
	const fileType = file.type?.split( '/' )?.[ 0 ];
	const fileIconsUrl = useConfigValue( 'fileIconsUrl' );

	const iconType = extensionMap[ fileExtension ] || mimeMap[ fileType ] || 'txt';
	const iconClass = clsx( 'jp-forms__inbox-response-file__icon', {
		[ 'icon-' + iconType ]: ! file.is_previewable,
		'has-thumbnail': file.is_previewable,
	} );

	let iconStyle;
	if ( file.is_previewable ) {
		iconStyle = { backgroundImage: `url(${ file.url })`, backgroundSize: 'cover' };
	} else if ( fileIconsUrl ) {
		iconStyle = { backgroundImage: `url(${ fileIconsUrl }${ iconType }.svg)` };
	}
	return (
		<div className="jp-forms__inbox-response-file">
			<div className="jp-forms__inbox-response-file__info">
				<div className={ iconClass } style={ iconStyle }></div>
				<div className="jp-forms__inbox-response-file__name">
					{ file.is_previewable && (
						<Button target="_blank" variant="link" onClick={ onClick }>
							{ decodeEntities( file.name ) }
						</Button>
					) }
					{ ! file.is_previewable && (
						<ExternalLink href={ file.url + '&preview=true' }>
							{ decodeEntities( file.name ) }
						</ExternalLink>
					) }
					<div className="jp-forms__inbox-response-file__meta-info">
						{ sprintf(
							/* translators: %1$s size of the file and %2$s is the file extension */
							__( '%1$s, %2$s', 'jetpack-forms' ),
							file.size,
							fileExtension.toUpperCase()
						) }
					</div>
				</div>
			</div>
			<span className="jp-forms__inbox-response-file__item-actions">
				<Tooltip text={ __( 'Download', 'jetpack-forms' ) }>
					<Button variant="secondary" href={ file.url } target="_blank">
						<Icon icon={ download } />
					</Button>
				</Tooltip>
			</span>
		</div>
	);
};

export default FieldFile;
