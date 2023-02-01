// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { Button, PanelRow, Dropdown, VisuallyHidden, Flex, FlexBlock } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { PostVisibilityCheck } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS } from './constants';

export const accessOptions = {
	everybody: {
		label: __( 'Everybody', 'jetpack' ),
		info: __( 'Visible to everyone.', 'jetpack' ),
	},
	subscribers: {
		label: __( 'All subscribers', 'jetpack' ),
		info: __( 'Visible to everyone that subscribes to your site.', 'jetpack' ),
	},
	paid_subscribers: {
		label: __( 'Paid subscribers', 'jetpack' ),
		info: __( 'Visible to everyone that purchases a paid plan on your site.', 'jetpack' ),
	},
};

function NewsletterAccessChoices( { accessLevel, onChange } ) {
	const instanceId = useInstanceId( NewsletterAccessChoices );
	return (
		<fieldset className="editor-post-visibility__fieldset">
			<VisuallyHidden as="legend">{ __( 'Audience', 'jetpack' ) } </VisuallyHidden>
			{ Object.keys( accessOptions ).map( key => (
				<div className="editor-post-visibility__choice" key={ key }>
					<input
						type="radio"
						checked={ key === accessLevel }
						name={ `editor-post-visibility__setting-${ instanceId }` }
						value={ key }
						id={ `editor-post-${ key }-${ instanceId }` }
						aria-describedby={ `editor-post-${ key }-${ instanceId }-description` }
						className="editor-post-visibility__radio"
						onChange={ event => {
							const obj = {};
							obj[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ] = event?.target?.value;
							return onChange && onChange( obj );
						} }
					/>
					<label
						htmlFor={ `editor-post-${ key }-${ instanceId }` }
						className="editor-post-visibility__label"
					>
						{ accessOptions[ key ].label }
					</label>
					<p
						id={ `editor-post-${ key }-${ instanceId }-description` }
						className="editor-post-visibility__info"
					>
						{ accessOptions[ key ].info }
					</p>
				</div>
			) ) }
		</fieldset>
	);
}

export function NewsletterAccess( { accessLevel, setPostMeta, withModal = true } ) {
	if ( ! accessLevel || ! Object.keys( accessOptions ).includes( accessLevel ) ) {
		accessLevel = Object.keys( accessOptions )[ 0 ];
	}
	const accessLabel = accessOptions[ accessLevel ]?.label;

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PanelRow className="edit-post-post-visibility">
					<Flex direction={ withModal ? 'row' : 'column' }>
						{
							<FlexBlock>
								<span>{ __( 'Access', 'jetpack' ) }</span>
							</FlexBlock>
						}
						{ ! canEdit && <span>{ accessLabel }</span> }
						{ withModal && canEdit && (
							<FlexBlock>
								<Dropdown
									placement="bottom-end"
									contentClassName="edit-post-post-visibility__dialog"
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
										<div className="editor-post-visibility">
											<InspectorPopoverHeader
												title={ __( 'Audience', 'jetpack' ) }
												help={ __( 'Control how this newsletter is viewed.', 'jetpack' ) }
												onClose={ onClose }
											/>
											<NewsletterAccessChoices onChange={ setPostMeta } />
										</div>
									) }
								/>
							</FlexBlock>
						) }

						{ ! withModal && canEdit && (
							<FlexBlock>
								<NewsletterAccessChoices accessLevel={ accessLevel } onChange={ setPostMeta } />
							</FlexBlock>
						) }
					</Flex>
				</PanelRow>
			) }
		/>
	);
}
