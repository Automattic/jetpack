// Runs before DOM ready, so core's theme.js finds the tab when it routes `?browse=wpcom`.
( () => {
	const config = window.wpcomThemesTab;
	if ( ! config ) {
		return;
	}

	const list = document.querySelector( '.wp-filter .filter-links' );
	if ( list ) {
		const link = document.createElement( 'a' );
		link.href = '#';
		link.dataset.sort = config.sort;
		link.textContent = config.label;

		const item = document.createElement( 'li' );
		item.appendChild( link );
		list.prepend( item );
	}

	const views = window.wp && window.wp.themes && window.wp.themes.view;
	if ( ! views ) {
		return;
	}

	/**
	 * Offers the plan a theme needs in place of the install core would otherwise run.
	 *
	 * The button is replaced rather than relabelled: core installs on a click anywhere in
	 * `.theme-install`, and this theme is not one the site may install yet.
	 *
	 * @param {Element} button - Core's install or activate button.
	 * @param {object}  theme  - The theme being rendered.
	 * @return {void}
	 */
	const offerUpgrade = ( button, theme ) => {
		const upgrade = document.createElement( 'a' );
		upgrade.className = button.classList.contains( 'button-compact' )
			? 'button button-primary button-compact'
			: 'button button-primary';
		upgrade.href = theme.upgrade_url;
		upgrade.textContent = config.upgrade;
		// Core labels its own buttons per theme, which a grid of them needs.
		if ( config.upgradeLabel ) {
			upgrade.setAttribute( 'aria-label', config.upgradeLabel.replace( '%s', theme.name ) );
		}
		button.replaceWith( upgrade );
	};

	/**
	 * Names the plan a theme needs, so the upgrade says what it buys.
	 *
	 * @param {object} theme    - The theme being rendered.
	 * @param {string} modifier - Extra class for where the badge is going.
	 * @return {Element} The badge.
	 */
	const planBadge = ( theme, modifier ) => {
		const badge = document.createElement( 'span' );
		badge.className = modifier ? `wpcom-themes-tab__plan ${ modifier }` : 'wpcom-themes-tab__plan';
		badge.textContent = theme.plan_badge;
		return badge;
	};

	/**
	 * Patches a rendered theme with what its plan costs this site.
	 *
	 * @param {Element}  el    - The view's element.
	 * @param {object}   theme - The theme being rendered.
	 * @param {Function} badge - Places the plan badge for this view.
	 * @return {void}
	 */
	const showPlan = ( el, theme, badge ) => {
		if ( ! el || ! theme || ! theme.plan_badge ) {
			return;
		}

		// Only a theme the plan excludes needs its install taken away.
		if ( theme.upgrade_url ) {
			const button = el.querySelector( '.theme-install, .activate' );
			if ( button ) {
				offerUpgrade( button, theme );
			}
		}

		badge( el, theme );
	};

	/**
	 * Decorates what a core view renders, leaving its own markup to core.
	 *
	 * @param {object}   view     - A Backbone view class from core's theme.js.
	 * @param {Function} decorate - Runs against the rendered element.
	 * @return {void}
	 */
	const afterRender = ( view, decorate ) => {
		const render = view.prototype.render;
		view.prototype.render = function () {
			const result = render.apply( this, arguments );
			// A throw here would take the whole grid with it, so a view without a model is left alone.
			if ( this.model ) {
				decorate( this.el, this.model.toJSON() );
			}
			return result;
		};
	};

	// On a card the badge sits over the screenshot; in the preview it follows the author line.
	afterRender( views.Theme, ( el, theme ) =>
		showPlan( el, theme, () => {
			const screenshot = el.querySelector( '.theme-screenshot' );
			if ( screenshot ) {
				screenshot.appendChild( planBadge( theme, 'wpcom-themes-tab__plan--on-screenshot' ) );
			}
		} )
	);

	if ( views.Preview ) {
		afterRender( views.Preview, ( el, theme ) =>
			showPlan( el, theme, () => {
				const author = el.querySelector( '.theme-by' );
				if ( author ) {
					author.insertAdjacentElement( 'afterend', planBadge( theme ) );
				}
			} )
		);
	}
} )();
