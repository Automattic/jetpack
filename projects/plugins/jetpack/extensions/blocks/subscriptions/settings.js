// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { Button, PanelRow, Dropdown, VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { PostAccessCheck } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS } from './constants';

const accessOptions = {
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

export function NewsletterAccess( { accessLevel, setPostMeta } ) {
	const instanceId = useInstanceId( NewsletterAccess );
	const accessLabel = accessOptions[ accessLevel ]?.label ?? 'Public';

	return (
		<PostAccessCheck
			render={ ( { canEdit } ) => (
				<PanelRow className="edit-post-post-access">
					<span>{ __( 'Access', 'jetpack' ) }</span>
					{ ! canEdit && <span>{ accessLabel }</span> }
					{ canEdit && (
						<Dropdown
							position="bottom left"
							contentClassName="edit-post-post-access__dialog"
							focusOnMount
							renderToggle={ ( { isOpen, onToggle } ) => (
								<Button
									isTertiary
									onClick={ onToggle }
									aria-expanded={ isOpen }
									aria-label={ sprintf(
										// translators: %s: Current newsletter post access.
										__( 'Select audience: %s', 'jetpack' ),
										accessLabel
									) }
								>
									{ accessLabel }
								</Button>
							) }
							renderContent={ ( { onClose } ) => (
								<div className="editor-post-access">
									<InspectorPopoverHeader
										title={ __( 'Audience', 'jetpack' ) }
										help={ __( 'Control how this newsletter is viewed.', 'jetpack' ) }
										onClose={ onClose }
									/>
									<fieldset className="editor-post-access__fieldset">
										<VisuallyHidden as="legend">{ __( 'Audience', 'jetpack' ) } </VisuallyHidden>
										{ Object.keys( accessOptions ).map( key => (
											<div className="editor-post-access__choice" key={ key }>
												<input
													type="radio"
													checked={ key === accessLevel }
													name={ `editor-post-access__setting-${ instanceId }` }
													value={ key }
													id={ `editor-post-${ key }-${ instanceId }` }
													aria-describedby={ `editor-post-${ key }-${ instanceId }-description` }
													className="editor-post-access__radio"
													onChange={ event => {
														const obj = {};
														obj[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ] = event?.target?.value;
														return setPostMeta( obj );
													} }
												/>
												<label
													htmlFor={ `editor-post-${ key }-${ instanceId }` }
													className="editor-post-access__label"
												>
													{ accessOptions[ key ].label }
												</label>
												<p
													id={ `editor-post-${ key }-${ instanceId }-description` }
													className="editor-post-access__info"
												>
													{ accessOptions[ key ].info }
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
