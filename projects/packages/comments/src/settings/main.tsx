/* @jsxImportSource react */
import CommentFormSettingsCard from '.';
import type { HostProps } from './types';

const settings = window.jetpackCommentsSettings;

// Jetpack's Discussion settings render this from the global, so the dashboard needs no import of the package.
if ( settings ) {
	settings.CommentFormSettings = ( props: HostProps ) => (
		<CommentFormSettingsCard
			preview={ settings.preview }
			hasBlockEditor={ settings.hasBlockEditor }
			{ ...props }
		/>
	);
}
