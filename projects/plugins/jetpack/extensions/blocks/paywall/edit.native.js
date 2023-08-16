import { HorizontalRule } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { accessOptions } from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { store as membershipProductsStore } from '../../store/membership-products';
import styles from './editor.scss';

export default function PaywallEdit() {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const accessLevel = useAccessLevel( postType );
	const [ , setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );
	const getText = key => {
		switch ( key ) {
			case accessOptions.everybody.key:
				return __( 'Change visibility to enable paywall', 'jetpack' );
			case accessOptions.subscribers.key:
				return __( 'Subscriber-only content below', 'jetpack' );
			case accessOptions.paid_subscribers.key:
				return __( 'Paid content below this line', 'jetpack' );
			default:
				return __( 'Paywall', 'jetpack' );
		}
	};

	const text = getText( accessLevel );

	const { hasNewsletterPlans, stripeConnectUrl, isLoading } = useSelect( select => {
		const { getNewsletterProducts, getConnectUrl, isApiStateLoading } =
			select( membershipProductsStore );

		return {
			isLoading: isApiStateLoading(),
			stripeConnectUrl: getConnectUrl(),
			hasNewsletterPlans: getNewsletterProducts()?.length !== 0,
		};
	} );

	console.log( '>>>', { hasNewsletterPlans, stripeConnectUrl, isLoading } );

	const textStyle = usePreferredColorSchemeStyle(
		styles[ 'paywall--text' ],
		styles[ 'paywall--text__dark' ]
	);
	const lineStyle = usePreferredColorSchemeStyle(
		styles[ 'paywall--line' ],
		styles[ 'paywall--line__dark' ]
	);

	return (
		<HorizontalRule
			text={ text }
			marginLeft={ 0 }
			marginRight={ 0 }
			textStyle={ textStyle }
			lineStyle={ lineStyle }
		/>
	);
}
