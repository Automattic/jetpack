import { getAdminUrl } from '@automattic/jetpack-script-data';
import { SelectControl, ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Link, Stack, Text } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import type { SocialNotesConfig } from '../../social-store/types';

/**
 * Content creation card — Social Notes toggle + per-feature options.
 *
 * Social Notes lives in the Social plugin (the CPT registration is in
 * `projects/plugins/social/src/class-note.php`), so this card is only
 * mounted when the Social plugin is active. The chassis composes WPDS
 * primitives directly; the legacy `SocialNotesToggle` from
 * `_inc/components/admin-page/toggles/social-notes-toggle/` is left in
 * place for the legacy admin shell and is retired alongside it in PR 5.
 *
 * @return The card.
 */
export default function ContentCreationCard(): JSX.Element {
	const { isEnabled, isUpdating, appendLink, linkFormat } = useSelect( select => {
		const store = select( socialStore );
		const { socialNotes } = store.getSocialSettings();

		return {
			isEnabled: socialNotes.enabled,
			appendLink: socialNotes.config.append_link ?? true,
			linkFormat: socialNotes.config.link_format,
			isUpdating: store.isSavingSiteSettings(),
		};
	}, [] );

	const { toggleSocialNotes, updateSocialNotesConfig } = useDispatch( socialStore );

	const onToggle = useCallback(
		( next: boolean ) => {
			toggleSocialNotes( next );
		},
		[ toggleSocialNotes ]
	);

	const onToggleAppendLink = useCallback(
		( append_link: boolean ) => {
			updateSocialNotesConfig( { append_link } );
		},
		[ updateSocialNotesConfig ]
	);

	const onChangeLinkFormat = useCallback(
		( link_format: string ) => {
			updateSocialNotesConfig( {
				link_format: link_format as SocialNotesConfig[ 'link_format' ],
			} );
		},
		[ updateSocialNotesConfig ]
	);

	const newNoteUrl = getAdminUrl( 'post-new.php?post_type=jetpack-social-note' );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Social Notes', 'jetpack-publicize-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Enable Social Notes', 'jetpack-publicize-pkg' ) }
						checked={ isEnabled }
						disabled={ isUpdating }
						onChange={ onToggle }
						help={ __(
							'Quickly jot down short notes and share them with your followers — no titles or formatting needed.',
							'jetpack-publicize-pkg'
						) }
					/>
					{ isEnabled && (
						<>
							<Stack direction="row" gap="md" className="jetpack-social-settings__card-actions">
								<Button
									variant="outline"
									size="compact"
									nativeButton={ false }
									render={ <a href={ newNoteUrl } /> }
								>
									{ __( 'Create a note', 'jetpack-publicize-pkg' ) }
								</Button>
							</Stack>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Append post link', 'jetpack-publicize-pkg' ) }
								checked={ appendLink }
								disabled={ isUpdating }
								onChange={ onToggleAppendLink }
								help={ __(
									'Whether to append the post link when sharing a note.',
									'jetpack-publicize-pkg'
								) }
							/>
							{ appendLink && (
								<div className="jetpack-social-settings__card-nested">
									<SelectControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={ __( 'Link format', 'jetpack-publicize-pkg' ) }
										value={ linkFormat ?? 'full_url' }
										disabled={ isUpdating }
										onChange={ onChangeLinkFormat }
										options={ [
											{ label: __( 'Full URL', 'jetpack-publicize-pkg' ), value: 'full_url' },
											{ label: __( 'Shortlink', 'jetpack-publicize-pkg' ), value: 'shortlink' },
											{
												label: __( 'Permashortcitation', 'jetpack-publicize-pkg' ),
												value: 'permashortcitation',
											},
										] }
										help={
											<Text variant="body-sm">
												{ __(
													'Format of the link to use when sharing a note.',
													'jetpack-publicize-pkg'
												) }
												&nbsp;
												<Link
													openInNewTab
													href="https://jetpack.com/redirect/?source=jetpack-social-notes-link-format"
												>
													{ __( 'Learn more', 'jetpack-publicize-pkg' ) }
												</Link>
											</Text>
										}
									/>
								</div>
							) }
						</>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
