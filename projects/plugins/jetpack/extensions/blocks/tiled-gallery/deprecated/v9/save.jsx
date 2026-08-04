import { useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';
import { getActiveStyleName } from '../../../../shared/block-styles';
import { LAYOUT_STYLES } from '../../constants';
import { defaultColumnsNumber } from '../../edit';
import Layout from '../../layout';

/**
 * Same markup as the current version, but always building external Photon (i0.wp.com) image URLs.
 *
 * Galleries saved before the site's Photon-domain setting was honoured have those URLs in their
 * markup — on VIP sites in particular, where images are now kept on the site's own host. Without
 * this deprecation the current save() regenerates different URLs while the post is parsed and every
 * one of those galleries is flagged as invalid on load.
 *
 * Attributes are unchanged, so there is nothing to migrate: matching here keeps the block valid, and
 * the next save re-serializes it with the URLs the site asks for.
 *
 * This is the only deprecation that reproduces the current markup. The much older v6 happens to match
 * it too for plain galleries — its wrapper differs only by whitespace, which validation forgives —
 * but v6 knows nothing about custom links, so galleries using `linkTo: 'custom'` match here and
 * nowhere else. Removing this file invalidates exactly those.
 *
 * Never edit this file to follow ../../save.jsx. It has to keep emitting the markup that is already
 * in the database; when the current markup changes, add a new deprecation instead.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Block attributes.
 * @return {import('react').ReactElement} The saved markup.
 */
export default function TiledGallerySave( { attributes } ) {
	const { imageFilter, images } = attributes;

	if ( ! images.length ) {
		return null;
	}

	const {
		align,
		className,
		columns = defaultColumnsNumber( attributes ),
		linkTo,
		roundedCorners,
		columnWidths,
	} = attributes;
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps } className={ clsx( blockProps.className, className ) }>
			<Layout
				align={ align }
				columns={ columns }
				imageFilter={ imageFilter }
				images={ images }
				isSave
				layoutStyle={ getActiveStyleName( LAYOUT_STYLES, className ) }
				linkTo={ linkTo }
				roundedCorners={ roundedCorners }
				columnWidths={ columnWidths }
				skipPhotonDomain={ false }
			/>
		</div>
	);
}
