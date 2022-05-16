/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PocketCastsIcon } from '../icons/';
import PocketCastsLogo from './pocket-casts-logo';
import './pocket-casts.scss';

const FooterToolbar = props => {
	const {
		attributes: { url },
	} = props;
	return (
		<div class="jetpack-pocket-casts__footer-toolbar">
			<PocketCastsLogo></PocketCastsLogo>
			<a href={ url } target="_blank" rel="noreferrer">
				{ __( 'Open in Pocket Casts', 'jetpack' ) }
			</a>
		</div>
	);
};

export default {
	className: 'is-pocket-casts-provider',
	placeholderIcon: PocketCastsIcon,
	placeholderLabel: __( 'Pocket Casts Player', 'jetpack' ),
	placeholderInstructions: __( 'Enter your pocket casts URL.', 'jetpack' ),
	FooterToolbar,
};
