// The PALETTE global comes from '@automattic/color-studio' at build time.
// This is done so that the individual color values are bundled as hardcoded literals, rather than
// having to include the entire color set in the bundle.
// This will work as long as the keys are always literals as well.
/* global PALETTE */

/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './jetpack-colophon.scss';

/**
 * Module constants
 */
const COLOR_JETPACK = PALETTE[ 'Jetpack Green' ];
const COLOR_WHITE = PALETTE[ 'White' ]; // eslint-disable-line dot-notation

const logoSize = 12;
export const svg = (
	<svg
		className="jetpack-instant-search__jetpack-colophon-logo"
		height={ logoSize }
		width={ logoSize }
		viewBox={ `0 0 32 32` }
	>
		<path
			className="jetpack-logo__icon-circle"
			fill={ COLOR_JETPACK }
			d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z"
		/>
		<polygon
			className="jetpack-logo__icon-triangle"
			fill={ COLOR_WHITE }
			points="15,19 7,19 15,3 "
		/>
		<polygon
			className="jetpack-logo__icon-triangle"
			fill={ COLOR_WHITE }
			points="17,29 17,13 25,13 "
		/>
	</svg>
);

const JetpackColophon = props => {
	const locale_prefix = typeof props.locale === 'string' ? props.locale.split( '-', 1 )[ 0 ] : null;
	const url =
		locale_prefix && locale_prefix !== 'en'
			? 'https://' + locale_prefix + '.jetpack.com/search?utm_source=poweredby'
			: 'https://jetpack.com/search?utm_source=poweredby';
	return (
		<div className="jetpack-instant-search__jetpack-colophon">
			<a
				href={ url }
				rel="external noopener noreferrer nofollow"
				target="_blank"
				className="jetpack-instant-search__jetpack-colophon-link"
			>
				{ svg }
				<span className="jetpack-instant-search__jetpack-colophon-text">
					{ __( 'Search powered by Jetpack', 'jetpack-search-pkg' ) }
				</span>
			</a>
		</div>
	);
};

export default JetpackColophon;
