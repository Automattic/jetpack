/**
 * Cookie Consent Module Entry Point
 *
 * This module handles GDPR cookie consent and CCPA opt-out functionality.
 */

// Logger first: view dispatches wp_consent_saved at module load on a GPC opt-out.
import './logger';
import './view';
import './styles.scss';
