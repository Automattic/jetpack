import { Button, Placeholder } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BLOCK_CLASS } from './constants';

export const UserConnectedPlaceholder = ( {
	icon,
	notices,
	connectURL,
	onRecheck,
	isRechecking,
} ) => {
	const [ hasOpenedSetup, setHasOpenedSetup ] = useState( false );

	return (
		<Placeholder
			className={ BLOCK_CLASS }
			icon={ icon }
			label={ __( 'Mailchimp', 'jetpack' ) }
			notices={ notices }
			instructions={ __(
				'You need to connect your Mailchimp account and choose an audience in order to start collecting Email subscribers.',
				'jetpack'
			) }
		>
			<Button
				variant="secondary"
				href={ connectURL }
				target="_blank"
				onClick={ () => setHasOpenedSetup( true ) }
			>
				<span>{ __( 'Set up Mailchimp form', 'jetpack' ) }</span>
			</Button>
			{ hasOpenedSetup && (
				<div className={ `${ BLOCK_CLASS }-recheck` }>
					<Button
						variant="link"
						onClick={ onRecheck }
						isBusy={ isRechecking }
						disabled={ isRechecking }
						accessibleWhenDisabled
					>
						<span>
							{ isRechecking
								? __(
										'Checking connection…',
										'jetpack',
										/* dummy arg to avoid bad minification */ 0
									)
								: __( 'Re-check Connection', 'jetpack' ) }
						</span>
					</Button>
				</div>
			) }
		</Placeholder>
	);
};

export const UserNotConnectedPlaceholder = ( { icon, notices, connectURL } ) => (
	<Placeholder
		className={ BLOCK_CLASS }
		icon={ icon }
		label={ __( 'Mailchimp', 'jetpack' ) }
		notices={ notices }
		instructions={ __( "First, you'll need to connect your WordPress.com account.", 'jetpack' ) }
	>
		<Button variant="secondary" href={ connectURL }>
			{ __( 'Connect to WordPress.com', 'jetpack' ) }
		</Button>
	</Placeholder>
);
