import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCommandLoader } from '@wordpress/commands';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import FormsIcon from '../../blocks/shared/components/forms-icon';
import { spam } from '../../dashboard/icons';

const getDashboardUrl = status =>
	`admin.php?page=jetpack-forms-admin#/responses?status=${ status }`;

const getFormsCommands = () =>
	function useFormsGlobalCommands() {
		const { tracks } = useAnalytics();

		const commands = useMemo( () => {
			return [
				{
					icon: FormsIcon,
					label: __( 'See form responses', 'jetpack-forms' ),
					name: 'jetpack/forms-inbox',
					callback: ( { close } ) => {
						tracks.recordEvent( 'jetpack_command_palette_forms_inbox_open' );
						document.location.href = getDashboardUrl( 'inbox' );
						close();
					},
				},
				{
					icon: spam,
					label: __( 'Review form spam', 'jetpack-forms' ),
					name: 'jetpack/forms-spam',
					callback: ( { close } ) => {
						tracks.recordEvent( 'jetpack_command_palette_forms_spam_open' );
						document.location.href = getDashboardUrl( 'spam' );
						close();
					},
				},
				{
					icon: trash,
					label: __( 'See form trash', 'jetpack-forms' ),
					name: 'jetpack/forms-trash',
					callback: ( { close } ) => {
						tracks.recordEvent( 'jetpack_command_palette_forms_trash_open' );
						document.location.href = getDashboardUrl( 'trash' );
						close();
					},
				},
			];
		}, [ tracks ] );

		return {
			commands,
			isLoading: false,
		};
	};

const JetpackFormsCommands = () => {
	useCommandLoader( {
		name: 'jetpack/forms',
		hook: getFormsCommands(),
	} );
};

// Command palette available across WP Admin from Gutenberg v21.5 and WordPress v6.9
// https://github.com/WordPress/gutenberg/pull/71030
if ( typeof useCommandLoader === 'function' ) {
	JetpackFormsCommands();
} else {
	// eslint-disable-next-line no-console
	console.info( 'Command palette not available.' );
}
