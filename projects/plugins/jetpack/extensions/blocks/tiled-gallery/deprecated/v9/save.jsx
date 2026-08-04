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
 * This is deliberately kept even though the v8 deprecation also matches that content today: v8 does
 * so only because block validation forgives the stray whitespace node in its wrapper, which is not
 * something to rely on. Keep this file in step with ../../save.jsx.
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
