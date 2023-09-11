import {
	Button,
	ExternalLink,
	Notice,
	PanelBody,
	PanelRow,
	RangeControl,
	ToggleControl,
} from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { MAX_IMAGE_COUNT } from './constants';

export default function InstagramGalleryInspectorControls( {
	accountImageTotal,
	attributes,
	currentUserConnected,
	disconnectFromService,
	shouldRenderSidebarNotice,
	setAttributes,
} ) {
	const { accessToken, columns, count, instagramUser, isStackedOnMobile, spacing } = attributes;

	const renderSidebarNotice = () => {
		const noticeContent = accountImageTotal
			? sprintf(
					/* translators: placeholder is a number. */
					_n(
						'There is currently only %s post in your Instagram account.',
						'There are currently only %s posts in your Instagram account.',
						accountImageTotal,
						'jetpack'
					),
					accountImageTotal
			  )
			: __( 'There are currently no posts in your Instagram account.', 'jetpack' );
		return (
			<div className="wp-block-jetpack-instagram-gallery__count-notice">
				<Notice isDismissible={ false } status="info">
					{ noticeContent }
				</Notice>
			</div>
		);
	};

	return (
		<>
			<PanelBody title={ __( 'Account Settings', 'jetpack' ) }>
				<PanelRow>
					<span>{ __( 'Account', 'jetpack' ) }</span>
					<ExternalLink href={ `https://www.instagram.com/${ instagramUser }/` }>
						@{ instagramUser }
					</ExternalLink>
				</PanelRow>
				{ currentUserConnected && (
					<PanelRow>
						<Button
							isDestructive
							variant="link"
							onClick={ () => disconnectFromService( accessToken ) }
						>
							{ __( 'Disconnect your account', 'jetpack' ) }
						</Button>
					</PanelRow>
				) }
			</PanelBody>
			<PanelBody title={ __( 'Display Settings', 'jetpack' ) }>
				{ shouldRenderSidebarNotice ? renderSidebarNotice() : null }
				<RangeControl
					label={ __( 'Number of Posts', 'jetpack' ) }
					value={ count }
					onChange={ value => setAttributes( { count: value } ) }
					min={ 1 }
					max={ MAX_IMAGE_COUNT }
				/>
				<RangeControl
					label={ __( 'Number of Columns', 'jetpack' ) }
					value={ columns }
					onChange={ value => setAttributes( { columns: value } ) }
					min={ 1 }
					max={ 6 }
				/>
				<RangeControl
					label={ __( 'Image Spacing (px)', 'jetpack' ) }
					value={ spacing }
					onChange={ value => setAttributes( { spacing: value } ) }
					min={ 0 }
					max={ 50 }
				/>
				<ToggleControl
					label={ __( 'Stack on mobile', 'jetpack' ) }
					checked={ isStackedOnMobile }
					onChange={ () =>
						setAttributes( {
							isStackedOnMobile: ! isStackedOnMobile,
						} )
					}
				/>
			</PanelBody>
		</>
	);
}
