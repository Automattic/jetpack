import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import { getRedirectUrl } from '../../../components';
import Text from '../text';
import type { TermsOfServiceProps } from './types';
import './styles.scss';

const TermsOfService: React.FC< TermsOfServiceProps > = ( {
	className,
	multipleButtons,
	agreeButtonLabel,
} ) => (
	<Text className={ classNames( className, 'terms-of-service' ) }>
		{ multipleButtons ? (
			<MultipleButtonsText />
		) : (
			<SingleButtonText agreeButtonLabel={ agreeButtonLabel } />
		) }
	</Text>
);

const MultipleButtonsText = () =>
	createInterpolateElement(
		__(
			'By clicking the buttons above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
			'jetpack'
		),
		{
			tosLink: <Link slug="wpcom-tos" />,
			shareDetailsLink: <Link slug="jetpack-support-what-data-does-jetpack-sync" />,
		}
	);

const SingleButtonText = ( { agreeButtonLabel } ) =>
	createInterpolateElement(
		sprintf(
			/* translators: %s is a button label */
			__(
				'By clicking the <strong>%s</strong> button, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
				'jetpack'
			),
			agreeButtonLabel
		),
		{
			strong: <strong />,
			tosLink: <Link slug="wpcom-tos" />,
			shareDetailsLink: <Link slug="jetpack-support-what-data-does-jetpack-sync" />,
		}
	);

const Link: React.FC< { slug: string; children?: React.ReactNode } > = ( { slug, children } ) => (
	<a
		className="terms-of-service__link"
		href={ getRedirectUrl( slug ) }
		rel="noopener noreferrer"
		target="_blank"
	>
		{ children }
	</a>
);

export default TermsOfService;
