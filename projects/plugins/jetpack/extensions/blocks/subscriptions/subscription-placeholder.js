import { useAnalytics, getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink, Placeholder } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

const icon = getBlockIconComponent( metadata );

export const SubscriptionsPlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	const { tracks } = useAnalytics();

	const enableSubscriptionsModule = () => {
		tracks.recordEvent( 'jetpack_editor_subscriptions_enable' );
		return changeStatus( true );
	};

	// Track when the placeholder is viewed.
	useEffect( () => {
		tracks.recordEvent( 'jetpack_editor_subscriptions_placeholder_view' );
	}, [ tracks ] );

	return (
		<Placeholder
			icon={ icon }
			instructions={ __(
				"You'll need to activate the Subscriptions feature to use the Subcribe block.",
				'jetpack'
			) }
			label={ metadata.title }
		>
			<Button
				disabled={ isModuleActive || isLoading }
				isBusy={ isLoading }
				onClick={ enableSubscriptionsModule }
				variant="secondary"
			>
				{ isLoading
					? __( 'Activating Subscriptions', 'jetpack' )
					: __( 'Activate Subscriptions', 'jetpack', /* dummy arg to avoid bad minification */ 0 ) }
			</Button>
			<div className="membership-button__disclaimer">
				<ExternalLink href="https://jetpack.com/support/subscriptions/">
					{ __( 'Learn more about the Subscriptions feature.', 'jetpack' ) }
				</ExternalLink>
			</div>
		</Placeholder>
	);
};
