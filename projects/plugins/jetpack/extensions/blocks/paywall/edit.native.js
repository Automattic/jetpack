import { HorizontalRule } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { accessOptions } from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import styles from './editor.scss';

export default function PaywallEdit() {
	const textStyle = usePreferredColorSchemeStyle(
		styles[ 'paywall--text' ],
		styles[ 'paywall--text__dark' ]
	);
	const lineStyle = usePreferredColorSchemeStyle(
		styles[ 'paywall--line' ],
		styles[ 'paywall--line__dark' ]
	);

	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const accessLevel = useAccessLevel( postType );
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

	return <HorizontalRule text={ text } textStyle={ textStyle } lineStyle={ lineStyle } />;
}
