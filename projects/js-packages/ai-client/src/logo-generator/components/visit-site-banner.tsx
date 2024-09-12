/**
 * External dependencies
 */
import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import jetpackLogo from '../assets/images/jetpack-logo.svg';
import './visit-site-banner.scss';
/**
 * Types
 */
import type React from 'react';

export const VisitSiteBanner: React.FC< {
	className?: string;
	onVisitBlankTarget?: () => void;
} > = ( { className = null, onVisitBlankTarget } ) => {
	return (
		<div className={ clsx( 'jetpack-ai-logo-generator-modal-visit-site-banner', className ) }>
			<div className="jetpack-ai-logo-generator-modal-visit-site-banner__jetpack-logo">
				<img src={ jetpackLogo } alt="Jetpack" />
			</div>
			<div className="jetpack-ai-logo-generator-modal-visit-site-banner__content">
				<strong>
					{ __(
						'Do you want to know all the amazing things you can do with Jetpack AI?',
						'jetpack-ai-client'
					) }
				</strong>
				<span>
					{ __(
						'Generate and tweak content, create forms, get feedback and much more.',
						'jetpack-ai-client'
					) }
				</span>
				<div>
					<Button
						variant="link"
						href="https://jetpack.com/redirect/?source=logo_generator_learn_more_about_jetpack_ai"
						target="_blank"
						onClick={ onVisitBlankTarget ? onVisitBlankTarget : null }
					>
						{ __( 'Learn more about Jetpack AI', 'jetpack-ai-client' ) }
						<Icon icon={ external } size={ 20 } />
					</Button>
				</div>
			</div>
		</div>
	);
};
