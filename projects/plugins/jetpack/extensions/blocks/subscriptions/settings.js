// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { Button, PanelRow, Dropdown, VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useEntityProp } from '@wordpress/core-data';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { PostVisibilityCheck } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';

const visibilityOptions = {
	public: {
		label: __( 'Public', 'jetpack' ),
		info: __( 'Visible to everyone', 'jetpack' ),
	},
	members_only: {
		label: __( 'Subscribers', 'jetpack' ),
		info: __( 'Visible to only subscribers', 'jetpack' ),
	},
	nobody: {
		label: __( 'Private', 'jetpack' ),
		info: __( 'Visible to only admins and editors', 'jetpack' ),
	},
};

export default function NewsletterSettings() {
	const [ postMeta, setPostMeta ] = useEntityProp( 'postType', 'post', 'meta' );
	const visibilityKey = postMeta._newsletter_visibility ?? 'public';
	const visibilityLabel = visibilityOptions[ visibilityKey ]?.label ?? 'Public';

	return (
		<>
			<PanelRow>
				<NewsletterAudience
					setPostMeta={ setPostMeta }
					visibilityKey={ visibilityKey }
					visibilityLabel={ visibilityLabel }
				/>
			</PanelRow>

			<PluginPrePublishPanel title={ __( 'Newsletter settings', 'jetpack' ) }>
				<NewsletterAudience
					setPostMeta={ setPostMeta }
					visibilityKey={ visibilityKey }
					visibilityLabel={ visibilityLabel }
				/>
			</PluginPrePublishPanel>
		</>
	);
}

function NewsletterAudience( { visibilityLabel, visibilityKey, setPostMeta } ) {
	const instanceId = useInstanceId( NewsletterAudience );

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PanelRow className="edit-post-post-visibility">
					<span>{ __( 'Audience', 'jetpack' ) }</span>
					{ ! canEdit && <span>{ visibilityLabel }</span> }
					{ canEdit && (
						<Dropdown
							position="bottom left"
							contentClassName="edit-post-post-visibility__dialog"
							focusOnMount
							renderToggle={ ( { isOpen, onToggle } ) => (
								<Button
									isTertiary
									onClick={ onToggle }
									aria-expanded={ isOpen }
									aria-label={ sprintf(
										// translators: %s: Current newsletter post visibility.
										__( 'Select audience: %s', 'jetpack' ),
										visibilityLabel
									) }
								>
									{ visibilityLabel }
								</Button>
							) }
							renderContent={ ( { onClose } ) => (
								<div className="editor-post-visibility">
									<InspectorPopoverHeader
										title={ __( 'Audience', 'jetpack' ) }
										help={ __( 'Control how this newsletter is viewed.', 'jetpack' ) }
										onClose={ onClose }
									/>
									<fieldset className="editor-post-visibility__fieldset">
										<VisuallyHidden as="legend">{ __( 'Audience', 'jetpack' ) } </VisuallyHidden>
										{ Object.keys( visibilityOptions ).map( key => (
											<div className="editor-post-visibility__choice" key={ key }>
												<input
													type="radio"
													checked={ key === visibilityKey }
													name={ `editor-post-visibility__setting-${ instanceId }` }
													value={ key }
													id={ `editor-post-${ key }-${ instanceId }` }
													aria-describedby={ `editor-post-${ key }-${ instanceId }-description` }
													className="editor-post-visibility__radio"
													onChange={ event =>
														setPostMeta( { _newsletter_visibility: event?.target?.value } )
													}
												/>
												<label
													htmlFor={ `editor-post-${ key }-${ instanceId }` }
													className="editor-post-visibility__label"
												>
													{ visibilityOptions[ key ].label }
												</label>
												<p
													id={ `editor-post-${ key }-${ instanceId }-description` }
													className="editor-post-visibility__info"
												>
													{ visibilityOptions[ key ].info }
												</p>
											</div>
										) ) }
									</fieldset>
								</div>
							) }
						/>
					) }
				</PanelRow>
			) }
		/>
	);
}
