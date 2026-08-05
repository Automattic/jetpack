import { useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';
import { getActiveStyleName } from '../../../../shared/block-styles';
import { LAYOUT_STYLES } from '../../constants';
import { defaultColumnsNumber } from '../../edit';
import Layout from '../../layout';

/**
 * Build a save() with the current markup that always serves images from one particular host,
 * whatever this site currently asks for.
 *
 * The block bakes photonized image URLs into its markup, so the site's Photon-domain setting decides
 * what save() emits. Whenever that setting changes — a site moving on or off the VIP plan, or the
 * `jetpack_skip_photon_domain` filter being added or removed — the galleries already in the database
 * hold the other host's URLs, the current save() regenerates something different while the post is
 * parsed, and every one of them is flagged as invalid on load. One of these two deprecations
 * reproduces that markup, whichever direction the setting moved in.
 *
 * Attributes are unchanged, so there is nothing to migrate: matching keeps the block valid, and the
 * next save re-serializes it with the URLs the site asks for now.
 *
 * These are the only deprecations that reproduce the current markup. The much older v6 happens to
 * match plain galleries too — its wrapper differs only by whitespace, which validation forgives — but
 * it knows nothing about custom links, so galleries using `linkTo: 'custom'` match here and nowhere
 * else.
 *
 * Never edit this file to follow ../../save.jsx. It has to keep emitting markup that is already in
 * the database; when the current markup changes, add new deprecations instead — and note that unlike
 * the single-snapshot v1…v8 convention, that means **two** of them, one per image host, because both
 * hosts exist in the wild for any given markup shape.
 *
 * These entries build on the live `Layout`, rather than freezing a copy of the layout tree the way
 * v6/utils and v8/layout do, so a change to `../../layout` moves them too. `test/photon-domain.js`
 * guards that with byte-level fixtures of the stored markup: if the shared layout changes shape,
 * those assertions fail and this file needs frozen copies of whatever moved.
 *
 * @param {boolean} skipPhotonDomain - Whether to build site-host URLs rather than Photon ones.
 * @return {Function} A save component pinned to that host.
 */
function createSave( skipPhotonDomain ) {
	return function TiledGallerySave( { attributes } ) {
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
					skipPhotonDomain={ skipPhotonDomain }
				/>
			</div>
		);
	};
}

// Galleries saved while the site served images from the external Photon domain.
export const savePhotonDomain = createSave( false );

// Galleries saved while the site served images from its own host.
export const saveSiteHost = createSave( true );
