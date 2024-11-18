import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import Text from '../text';

const ThreatNotices = ( {
	fixerState,
}: {
	fixerState: { inProgress: boolean; error: boolean; stale: boolean };
} ) => {
	if ( fixerState.error ) {
		return (
			<Notice isDismissible={ false } status="error">
				<Text>{ __( 'An error occurred auto-fixing this threat.', 'jetpack' ) }</Text>
			</Notice>
		);
	}
	if ( fixerState.stale ) {
		return (
			<Notice isDismissible={ false } status="error">
				<Text>{ __( 'The auto-fixer is taking longer than expected.', 'jetpack' ) }</Text>
			</Notice>
		);
	}
	if ( fixerState.inProgress && ! fixerState.stale ) {
		return (
			<Notice isDismissible={ false } status="success">
				<Text>{ __( 'The auto-fixer is in progress.', 'jetpack' ) }</Text>
			</Notice>
		);
	}
	return null;
};

export default ThreatNotices;
