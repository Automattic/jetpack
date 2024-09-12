import PropTypes from 'prop-types';

export default {
	/** The header text, 'Safe Mode' by default. */
	headerText: PropTypes.string,
	/** Alt attribute for the custom logo image. */
	logoAlt: PropTypes.string,
	/** The main screen title. */
	mainTitle: PropTypes.string,
	/** The main screen body text. */
	mainBodyText: PropTypes.string,
	/** The "migration finished" screen title. */
	migratedTitle: PropTypes.string,
	/** The "migration finished" screen body text. */
	migratedBodyText: PropTypes.string,
	/** The migration card title. */
	migrateCardTitle: PropTypes.string,
	/** The migration card button label. */
	migrateButtonLabel: PropTypes.string,
	/** The migration card body. */
	migrateCardBodyText: PropTypes.string,
	/** The "start fresh" card title. */
	startFreshCardTitle: PropTypes.string,
	/** The "start fresh" card body. */
	startFreshCardBodyText: PropTypes.string,
	/** The "start fresh" card button label. */
	startFreshButtonLabel: PropTypes.string,
	/** The "non admin" screen title. */
	nonAdminTitle: PropTypes.string,
	/** The "non admin" screen body text. */
	nonAdminBodyText: PropTypes.string,
	/** The support page URL. */
	supportURL: PropTypes.string,
	/** The "stay in safe mode" button title. */
	stayInSafeModeButtonLabel: PropTypes.string,
};
