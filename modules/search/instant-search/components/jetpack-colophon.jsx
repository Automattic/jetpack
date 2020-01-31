/** @jsx h */

/**
 * External dependencies
 */
import { h, Fragment } from 'preact';
import { __ } from '@wordpress/i18n';
import { colors as PALETTE } from '@automattic/color-studio';

/**
 * Module constants
 */
const COLOR_JETPACK = PALETTE[ 'Jetpack Green' ];
const COLOR_WHITE = PALETTE[ 'White' ]; // eslint-disable-line dot-notation

const logoPath = (
	<Fragment>
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
	</Fragment>
);
const logoSize = 12;

const JetpackColophon = () => {
	return (
		<div className="jetpack-instant-search__jetpack-colophon">
			<a
				href="https://jetpack.com/search"
				rel="external noopener noreferrer"
				target="_blank"
				className="jetpack-instant-search__jetpack-colophon-link"
			>
				<svg
					className="jetpack-instant-search__jetpack-colophon-logo"
					height={ logoSize }
					width={ logoSize }
					viewBox={ `0 0 32 32` }
				>
					{ logoPath }
				</svg>
				<span className="jetpack-instant-search__jetpack-colophon-text">
					{ __( 'Search powered by Jetpack', 'jetpack' ) }
				</span>
			</a>
		</div>
	);
};

export default JetpackColophon;
