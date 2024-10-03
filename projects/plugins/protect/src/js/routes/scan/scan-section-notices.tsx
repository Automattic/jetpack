import { Col, Container } from '@automattic/jetpack-components';
import { ConnectionError, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import styles from './styles.module.scss';

/**
 * Scan Section Notices
 *
 * Component that renders the connection error notice and the Jetpack admin notices.
 *
 * @return {Component} The component.
 */
export default function ScanSectionNotices() {
	const { hasConnectionError } = useConnectionErrorNotice();

	return (
		<Container horizontalSpacing={ 0 }>
			{ hasConnectionError && (
				<Col className={ styles[ 'connection-error-col' ] }>
					<ConnectionError />
				</Col>
			) }
			<Col>
				<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
			</Col>
		</Container>
	);
}
