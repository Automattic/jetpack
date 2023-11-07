import { HorizontalRule } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { View, Text } from 'react-native';
import styles from './editor.scss';

export default function PaywallEdit() {
	const paywallStyle = usePreferredColorSchemeStyle( styles.paywall, styles.paywall__dark );
	const textStyle = usePreferredColorSchemeStyle(
		styles[ 'paywall--text' ],
		styles[ 'paywall--text__dark' ]
	);
	const subtextStyle = usePreferredColorSchemeStyle(
		styles[ 'paywall--subtext' ],
		styles[ 'paywall--subtext__dark' ]
	);
	const lineStyle = usePreferredColorSchemeStyle(
		styles[ 'paywall--line' ],
		styles[ 'paywall--line__dark' ]
	);

	return (
		<View style={ paywallStyle }>
			<HorizontalRule
				lineStyle={ lineStyle }
				style={ styles[ 'paywall--horizontalRule' ] }
				text={ __( 'Subscriber-only content below', 'jetpack' ) }
				textStyle={ textStyle }
			/>
			<Text style={ subtextStyle }>
				{ __( 'Access this Paywall block on your web browser for advanced settings.', 'jetpack' ) }
			</Text>
		</View>
	);
}
