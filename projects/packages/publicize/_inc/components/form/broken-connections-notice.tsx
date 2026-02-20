import { Button } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { _n } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';
import type { FC } from 'react';

export const BrokenConnectionsNotice: FC = () => {
	const { brokenConnections, reauthConnections } = useSelect( select => {
		const store = select( socialStore );
		return {
			brokenConnections: store.getBrokenConnections(),
			reauthConnections: store.getMustReauthConnections(),
		};
	}, [] );

	const { openConnectionsModal } = useDispatch( socialStore );

	const fixLink = (
		<Button
			variant="link"
			onClick={ openConnectionsModal }
			className={ styles[ 'broken-connection-btn' ] }
		/>
	);

	const problemConnections = [ ...brokenConnections, ...reauthConnections ];

	if ( ! problemConnections.length ) {
		return null;
	}

	return (
		<Notice status="error" isDismissible={ false }>
			{ createInterpolateElement(
				_n(
					'A social connection needs attention. <fixLink>Manage connections</fixLink> to fix it.',
					'Some social connections need attention. <fixLink>Manage connections</fixLink> to fix them.',
					problemConnections.length,
					'jetpack-publicize-pkg'
				),
				{
					fixLink,
				}
			) }
		</Notice>
	);
};
