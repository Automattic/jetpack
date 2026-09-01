import { getUserConnectionUrl } from '@automattic/jetpack-connection';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, _x } from '@wordpress/i18n';

/**
 * Notice to prompt user to connect their WordPress.com account.
 *
 * @return React element
 */
export function UserConnectionNotice() {
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	return (
		<Notice
			status="warning"
			isDismissible={ false }
			actions={ [
				{
					url: getUserConnectionUrl(),
					label: __( 'Connect now', 'jetpack-publicize-pkg' ),
					variant: 'link',
				},
			] }
		>
			{
				// When the post is published, the user needs to connect to re-share posts.
				// So, that has the priority over adding connections.
				isPostPublished
					? _x(
							'You must connect your WordPress.com account to be able to re-share posts.',
							'',
							'jetpack-publicize-pkg'
					  )
					: __(
							'You must connect your WordPress.com account to be able to connect social media accounts.',
							'jetpack-publicize-pkg'
					  )
			}
		</Notice>
	);
}
