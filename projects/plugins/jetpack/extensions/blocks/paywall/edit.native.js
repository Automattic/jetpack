import { HorizontalRule } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
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

	return (
		<HorizontalRule
			text={ __( 'Exclusive content below this line', 'jetpack' ) }
			marginLeft={ 0 }
			marginRight={ 0 }
			textStyle={ textStyle }
			lineStyle={ lineStyle }
		/>
	);
}
