import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const ActivateLicense = () => {
	const activateLicenseUrl = 'admin.php?page=my-jetpack#/add-license';

	return (
		<p className="jb-activate-license">
			{ createInterpolateElement(
				__(
					'Already have an existing plan or license key? <link>Click here to get started</link>',
					'jetpack-boost'
				),
				{
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					link: <a className="jb-activate-license__link" href={ activateLicenseUrl } />,
				}
			) }
		</p>
	);
};
