import { Notice, RadioControl, Spinner, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useAkismetConfig } from '@/hooks/use-akismet-config';

const PREVIEW_MODE_CODE = 'preview_mode_active';

/**
 * Settings tab: strictness radio + show-approved-comments toggle.
 *
 * Each control fires the mutation directly with the corresponding patch.
 * Pattern A from the conventions doc means the cache reflects the change
 * immediately on success, so the controls re-render with the new value.
 *
 * On preview-mode failure (`AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS` off), the
 * mutation surfaces a `WpError` with `code: 'preview_mode_active'`. We
 * branch on that to render a single notice; the underlying cache value
 * remains unchanged so the control snaps back.
 *
 * @return The settings UI.
 */
export function SettingsTab(): JSX.Element {
	const { config, update } = useAkismetConfig();

	if ( config.isLoading ) {
		return <Spinner />;
	}

	const data = config.data;
	if ( ! data ) {
		return <p>{ __( 'Could not load settings.', 'akismet' ) }</p>;
	}

	const previewMode = update.error?.code === PREVIEW_MODE_CODE;

	return (
		<div className="akismet-settings">
			{ previewMode && (
				<Notice status="warning" isDismissible={ false }>
					{ update.error?.message ?? __( 'Preview mode — settings save disabled.', 'akismet' ) }
				</Notice>
			) }
			<RadioControl
				label={ __( 'Strictness', 'akismet' ) }
				help={ __( 'Choose how aggressively Akismet should filter incoming comments.', 'akismet' ) }
				selected={ data.akismet_strictness }
				options={ [
					{
						label: __( 'Silently discard the worst spam', 'akismet' ),
						value: '1',
					},
					{
						label: __( 'Always put spam in the Spam folder for review', 'akismet' ),
						value: '0',
					},
				] }
				onChange={ value => update.mutate( { akismet_strictness: value as '0' | '1' } ) }
			/>
			<ToggleControl
				label={ __( 'Show the number of approved comments next to each commenter', 'akismet' ) }
				checked={ data.akismet_show_user_comments_approved === '1' }
				onChange={ checked =>
					update.mutate( {
						akismet_show_user_comments_approved: checked ? '1' : '0',
					} )
				}
				__nextHasNoMarginBottom
			/>
		</div>
	);
}
