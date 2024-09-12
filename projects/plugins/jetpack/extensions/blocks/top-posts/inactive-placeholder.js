import { isAtomicSite, getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

export const InactiveStatsPlaceholder = ( { className, isLoading, changeStatus } ) => {
	const enableFeature = () => {
		return changeStatus( true );
	};

	// Stats cannot be disabled on Simple sites, but they can on Atomic.
	const supportLink = isAtomicSite()
		? 'https://wordpress.com/support/stats/'
		: 'https://jetpack.com/support/jetpack-stats/';

	return (
		<div className={ className }>
			<Placeholder
				icon={ getBlockIconComponent( metadata ) }
				instructions={ __(
					"You'll need to activate the Stats module to use this block.",
					'jetpack'
				) }
				label={ metadata.title }
			>
				<Button
					disabled={ isLoading }
					isBusy={ isLoading }
					onClick={ enableFeature }
					variant="secondary"
				>
					{ isLoading ? __( 'Activating Stats', 'jetpack' ) : __( 'Activate Stats', 'jetpack', 0 ) }
				</Button>
				<div className="components-placeholder__learn-more">
					<ExternalLink href={ supportLink }>
						{ __( 'Learn more about the Stats module.', 'jetpack' ) }
					</ExternalLink>
				</div>
			</Placeholder>
		</div>
	);
};
