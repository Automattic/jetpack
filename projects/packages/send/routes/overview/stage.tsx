import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import SendPage from '../../_inc/components/send-page';

const Stage = () => (
	<SendPage active="overview" showTabs={ false }>
		<Text variant="body-md">{ __( 'Send is installed.', 'jetpack-send-pkg' ) }</Text>
	</SendPage>
);

export { Stage as stage };
