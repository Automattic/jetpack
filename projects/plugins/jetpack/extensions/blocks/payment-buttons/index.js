import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { Path, Rect, SVG, G, ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import { settings as paymentButtonSettings } from '../recurring-payments';
import edit from './edit';
import save from './save';
import './editor.scss';

export const name = 'payment-buttons';
export const title = __( 'Payment Buttons', 'jetpack' );
export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="M20 4H4c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2h16c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2zm0 2v2H4V6h16zM4 18v-6h16v6H4zm2-4h7v2H6v-2zm9 0h3v2h-3v-2z" />
		</G>
	</SVG>
);

const supportLink =
	isSimpleSite() || isAtomicSite()
		? 'https://wordpress.com/support/video-tutorials-add-payments-features-to-your-site-with-our-guides/#how-to-use-the-payments-block-video'
		: 'https://jetpack.com/support/jetpack-blocks/payments-block/';

export const settings = {
	apiVersion: 2,
	title,
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	description: (
		<Fragment>
			<p>
				{ __(
					'Prompt visitors to purchase your products and subscriptions with a group of buttons.',
					'jetpack'
				) }
			</p>
			<ExternalLink href={ supportLink }>{ __( 'Support reference', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),
	category: 'earn',
	keywords: [ ...new Set( [ paymentButtonSettings.title, ...paymentButtonSettings.keywords ] ) ],
	edit,
	save,
	supports: {
		__experimentalExposeControlsToChildren: true,
		align: [ 'wide', 'full' ],
		spacing: {
			blockGap: true,
			margin: [ 'vertical' ],
			__experimentalDefaultControls: {
				blockGap: true,
			},
		},
		__experimentalLayout: {
			allowSwitching: false,
			allowInheriting: false,
			default: {
				type: 'flex',
			},
		},
		typography: {
			fontSize: true,
			__experimentalFontFamily: true,
			__experimentalTextTransform: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
	},
};
