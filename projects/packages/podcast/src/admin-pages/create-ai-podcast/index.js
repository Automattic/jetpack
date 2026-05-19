/**
 * Create AI Podcast — vanilla-JS island.
 *
 * Server-rendered form lives in PHP; this file fetches quota, drives the
 * posts picker, submits the generate request, polls the job, and resumes
 * across reloads via the GET response's `activeJob`. All endpoints and
 * labels come from window.jetpackCreateAiPodcast (set by wp_localize_script).
 */

( function () {
	const data = window.jetpackCreateAiPodcast;
	if ( ! data ) {
		return;
	}

	const apiFetch = window.wp?.apiFetch;
	const sprintf = window.wp?.i18n?.sprintf || ( str => str );
	if ( ! apiFetch ) {
		return;
	}

	/**
	 * Fire a wpcom Tracks event via the global _tkq queue. The wpcom Tracks
	 * client picks it up on its next flush; if the queue isn't installed
	 * (Atomic without the wpcom client) the push is a silent no-op, which is
	 * the right tradeoff for instrumentation that must never affect UX.
	 *
	 * @param eventName  - Snake-case event name (`wpcom_create_ai_podcast_*`).
	 * @param properties - Optional event properties; blog_id is auto-attached.
	 */
	function recordEvent( eventName, properties = {} ) {
		try {
			const payload = { ...properties };
			const blogIdNum = Number( data.blogId );
			if ( Number.isFinite( blogIdNum ) && blogIdNum > 0 && payload.blog_id === undefined ) {
				payload.blog_id = blogIdNum;
			}
			window._tkq = window._tkq || [];
			window._tkq.push( [ 'recordEvent', eventName, payload ] );
		} catch {
			// Tracks is best-effort.
		}
	}

	/**
	 * Derive the target plan slug from a Calypso checkout URL so the upgrade
	 * event can carry which tier the user was offered without us re-deriving
	 * it from feature flags client-side.
	 * @param url
	 */
	function targetPlanFromUrl( url ) {
		if ( typeof url !== 'string' || url === '' ) {
			return '';
		}
		const match = url.match( /\/checkout\/[^/]+\/([a-z0-9_-]+)/i );
		return match ? match[ 1 ] : '';
	}

	/**
	 * Strip the `_envelope=1` wrapper that the wpcom proxy unconditionally
	 * adds to wpcom/v2 requests on Simple sites (see provider-v2.0.js
	 * `_envelope=1` append). The wrapped shape is `{ code, headers, body }`
	 * (see WPCOM_JSON_API::wrap_http_envelope). We unwrap to `body` for 2xx
	 * and throw the body for non-2xx so callers' try/catch paths fire the
	 * same way they do for native apiFetch errors on Atomic.
	 *
	 * @param opts
	 */
	async function apiCall( opts ) {
		const response = await apiFetch( opts );
		if (
			response &&
			typeof response === 'object' &&
			'body' in response &&
			'code' in response &&
			'headers' in response
		) {
			if ( response.code < 200 || response.code >= 300 ) {
				throw response.body || { code: 'unknown', message: `HTTP ${ response.code }` };
			}
			return response.body;
		}
		return response;
	}

	// Initial reads are pre-warmed server-side via wp_localize_script — see
	// class-create-ai-podcast-page.php::bootstrap_data(). The JS island never
	// fires the first quota/episodes requests itself; we only fetch on
	// post-success refresh, where freshness matters.
	const bootstrapQuota = data?.bootstrap?.quota ?? null;
	const bootstrapEpisodes = normalizeEpisodesPayload( data?.bootstrap?.episodes );

	const EPISODES_PER_PAGE = bootstrapEpisodes.perPage || 5;

	/**
	 * Accept either the envelope shape { items, total, page, perPage, totalPages }
	 * (preferred) or the legacy bare array (older sandbox releases) and
	 * normalize to the envelope. Keeps the JS island resilient across the
	 * cross-PR rollout.
	 *
	 * @param payload - Server-provided episodes payload.
	 */
	function normalizeEpisodesPayload( payload ) {
		if ( payload && typeof payload === 'object' && Array.isArray( payload.items ) ) {
			return {
				items: payload.items,
				total: Number.isFinite( payload.total ) ? payload.total : payload.items.length,
				page: Math.max( 1, Number( payload.page ) || 1 ),
				perPage: Math.max( 1, Number( payload.perPage ) || 5 ),
				totalPages: Math.max( 0, Number( payload.totalPages ) || 0 ),
			};
		}
		if ( Array.isArray( payload ) ) {
			// Legacy shape (upstream pre-pagination rollout): a flat list of
			// every episode. Slice to the configured page size and synthesize
			// a pager so the UX matches the new envelope behavior. Once the
			// wpcom-side pagination PR lands and opcache flushes everywhere
			// this branch falls dormant.
			const perPage = 5;
			const total = payload.length;
			return {
				items: payload.slice( 0, perPage ),
				total,
				page: 1,
				perPage,
				totalPages: perPage > 0 ? Math.ceil( total / perPage ) : 0,
			};
		}
		return { items: [], total: 0, page: 1, perPage: 5, totalPages: 0 };
	}

	let episodesState = bootstrapEpisodes;
	let lastQuotaSnapshot = null;

	const root = document.getElementById( 'jetpack-create-ai-podcast-app' );
	if ( ! root ) {
		return;
	}

	const form = root.querySelector( '[data-region="form"]' );
	const creditsEl = root.querySelector( '[data-region="credits"]' );
	const statusEl = root.querySelector( '[data-region="status"]' );
	const postsRegion = root.querySelector( '[data-region="posts"]' );
	const postsSearch = document.getElementById( 'jetpack-create-ai-podcast-posts-search' );
	const sourceRadios = form.querySelectorAll( 'input[name="source"]' );
	const windowSection = form.querySelector( '[data-source="window"]' );
	const postsSection = form.querySelector( '[data-source="posts"]' );
	const episodesSection = root.querySelector( '[data-region="episodes"]' );
	const episodesList = root.querySelector( '[data-region="episodes-list"]' );

	const selectedPostIds = new Set();
	let pollTimer = null;

	// --- Status notice rendering -------------------------------------------------

	/**
	 *
	 * @param tone
	 * @param message
	 * @param options
	 */
	function setStatus( tone, message, options ) {
		statusEl.dataset.state = 'active';
		statusEl.innerHTML = '';

		const card = document.createElement( 'div' );
		card.className = 'jetpack-create-ai-podcast__status-card';
		card.dataset.tone = tone;
		card.setAttribute( 'role', tone === 'error' ? 'alert' : 'status' );

		const body = document.createElement( 'div' );
		body.className = 'jetpack-create-ai-podcast__status-body';

		const text = document.createElement( 'p' );
		text.className = 'jetpack-create-ai-podcast__status-message';
		text.textContent = message;
		body.appendChild( text );

		if ( options?.link || options?.action ) {
			const actions = document.createElement( 'div' );
			actions.className = 'jetpack-create-ai-podcast__status-actions';

			if ( options?.link ) {
				const a = document.createElement( 'a' );
				a.href = options.link.href;
				a.textContent = options.link.label;
				a.className = 'jetpack-create-ai-podcast__status-link';
				if ( typeof options.link.onClick === 'function' ) {
					a.addEventListener( 'click', options.link.onClick );
				}
				actions.appendChild( a );
			}

			if ( options?.action ) {
				const btn = document.createElement( 'button' );
				btn.type = 'button';
				btn.className = 'button';
				btn.textContent = options.action.label;
				btn.addEventListener( 'click', options.action.onClick );
				actions.appendChild( btn );
			}

			body.appendChild( actions );
		}

		card.appendChild( body );

		if ( tone !== 'progress' ) {
			const dismiss = document.createElement( 'button' );
			dismiss.type = 'button';
			dismiss.className = 'jetpack-create-ai-podcast__status-dismiss';
			dismiss.setAttribute( 'aria-label', data.i18n.dismiss );
			dismiss.innerHTML =
				'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20">' +
				'<path d="M13.06 12l5.47-5.47-1.06-1.06L12 10.94 6.53 5.47 5.47 6.53 10.94 12l-5.47 5.47 1.06 1.06L12 13.06l5.47 5.47 1.06-1.06z" fill="currentColor" />' +
				'</svg>';
			dismiss.addEventListener( 'click', clearStatus );
			card.appendChild( dismiss );
		}

		statusEl.appendChild( card );
	}

	/**
	 *
	 */
	function clearStatus() {
		statusEl.dataset.state = 'idle';
		statusEl.innerHTML = '';
	}

	/**
	 *
	 * @param disabled
	 */
	function setFormDisabled( disabled ) {
		form.dataset.disabled = disabled ? 'true' : 'false';
		form.querySelectorAll( 'input, select, textarea, button' ).forEach( el => {
			if ( el.dataset.lockedDisabled === 'true' ) {
				el.disabled = true;
				return;
			}
			el.disabled = disabled;
		} );
	}

	// --- Quota ------------------------------------------------------------------

	/**
	 * @param quota
	 * @param upgradeUrl
	 */
	function renderCredits( quota, upgradeUrl ) {
		creditsEl.setAttribute( 'aria-busy', 'false' );
		creditsEl.dataset.state = 'visible';
		creditsEl.innerHTML = '';

		const label = document.createElement( 'span' );
		label.className = 'jetpack-create-ai-podcast__credits-label';
		label.textContent = data.i18n.creditsLabel;

		if ( quota?.unlimited ) {
			const header = document.createElement( 'div' );
			header.className = 'jetpack-create-ai-podcast__credits-header';

			const value = document.createElement( 'span' );
			value.className = 'jetpack-create-ai-podcast__credits-count';
			value.textContent = data.i18n.creditsUnlimited;

			header.appendChild( label );
			header.appendChild( value );
			creditsEl.appendChild( header );
			return;
		}

		const used = Math.max( 0, Number( quota?.used ?? 0 ) );
		const total = Math.max( 0, Number( quota?.quota ?? 0 ) );
		const remaining =
			typeof quota?.remaining === 'number' ? quota.remaining : Math.max( total - used, 0 );
		const ratio = total > 0 ? Math.min( 1, used / total ) : 0;
		const percent = Math.round( ratio * 100 );

		const header = document.createElement( 'div' );
		header.className = 'jetpack-create-ai-podcast__credits-header';

		const count = document.createElement( 'span' );
		count.className = 'jetpack-create-ai-podcast__credits-count';
		count.textContent = sprintf( data.i18n.creditsCount, used, total );

		header.appendChild( label );
		header.appendChild( count );
		creditsEl.appendChild( header );

		const bar = document.createElement( 'div' );
		bar.className = 'jetpack-create-ai-podcast__credits-bar';
		bar.setAttribute( 'role', 'progressbar' );
		bar.setAttribute( 'aria-valuemin', '0' );
		bar.setAttribute( 'aria-valuemax', String( total ) );
		bar.setAttribute( 'aria-valuenow', String( used ) );
		bar.setAttribute( 'aria-valuetext', sprintf( data.i18n.creditsUsed, used, total ) );

		const fill = document.createElement( 'div' );
		fill.className = 'jetpack-create-ai-podcast__credits-fill';
		fill.style.width = `${ percent }%`;
		if ( ratio >= 0.9 ) {
			fill.dataset.tone = 'danger';
		} else if ( ratio >= 0.7 ) {
			fill.dataset.tone = 'warning';
		}

		bar.appendChild( fill );
		creditsEl.appendChild( bar );

		const reset = formatResetPhrase( quota?.resetsAt );

		const meta = document.createElement( 'div' );
		meta.className = 'jetpack-create-ai-podcast__credits-meta';

		const remainingEl = document.createElement( 'span' );
		remainingEl.textContent = sprintf( data.i18n.creditsRemaining, remaining );
		meta.appendChild( remainingEl );

		const sep = document.createElement( 'span' );
		sep.className = 'jetpack-create-ai-podcast__credits-meta-sep';
		sep.setAttribute( 'aria-hidden', 'true' );
		sep.textContent = '·';
		meta.appendChild( sep );

		const resetEl = document.createElement( 'span' );
		resetEl.className = 'jetpack-create-ai-podcast__credits-meta-reset';
		resetEl.textContent = reset
			? sprintf( data.i18n.creditsResetSummary, reset.inline )
			: data.i18n.creditsResetMonthly;
		meta.appendChild( resetEl );

		creditsEl.appendChild( meta );

		const isOut = remaining === 0;
		const isLow = ! isOut && ratio >= 0.7;

		const quotaSummary = { used, quota: total, remaining };
		if ( isOut ) {
			let outMessage = '';
			if ( reset ) {
				outMessage = upgradeUrl
					? sprintf( data.i18n.outOfCreditsUpgrade, reset.inline )
					: sprintf( data.i18n.outOfCreditsWait, reset.inline );
			}
			creditsEl.appendChild(
				buildBanner( {
					state: 'out',
					title: data.i18n.outOfCreditsTitle,
					message: outMessage,
					upgradeUrl,
					quota: quotaSummary,
					reset,
				} )
			);
		} else if ( isLow && upgradeUrl ) {
			creditsEl.appendChild(
				buildBanner( {
					state: 'low',
					title: data.i18n.runningLowTitle,
					message: data.i18n.runningLowMessage,
					upgradeUrl,
					quota: quotaSummary,
					reset,
				} )
			);
		}
	}

	/**
	 * Translate quota.resetsAt into a relative phrase that works both inside
	 * a sentence (e.g. "your credits refresh {inline}") and as a stand-alone
	 * summary line (e.g. "Resets {inline}"). Returns null when the timestamp
	 * is missing or malformed so callers fall back to a generic "monthly"
	 * blurb.
	 *
	 * @param  resetsAt - ISO-8601 reset timestamp.
	 * @return {{ inline: string, days: number, date: Date } | null} Phrase, days until reset, and parsed Date — or null when input is missing.
	 */
	function formatResetPhrase( resetsAt ) {
		if ( ! resetsAt ) {
			return null;
		}
		const date = new Date( resetsAt );
		if ( Number.isNaN( date.getTime() ) ) {
			return null;
		}

		const msPerDay = 24 * 60 * 60 * 1000;
		const now = new Date();
		// Compare local-midnight days so the boundary lines up with the
		// calendar, not the reset's clock-time.
		const startOfToday = new Date( now.getFullYear(), now.getMonth(), now.getDate() ).getTime();
		const startOfReset = new Date( date.getFullYear(), date.getMonth(), date.getDate() ).getTime();
		const days = Math.max( 0, Math.round( ( startOfReset - startOfToday ) / msPerDay ) );

		let inline;
		if ( days === 0 ) {
			inline = data.i18n.relativeToday;
		} else if ( days === 1 ) {
			inline = data.i18n.relativeTomorrow;
		} else if ( days <= 30 ) {
			inline = sprintf( data.i18n.relativeDays, days );
		} else {
			const formatted = date.toLocaleDateString( undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			} );
			inline = sprintf( data.i18n.relativeOn, formatted );
		}

		return { inline, days, date };
	}

	/**
	 * How many days ago an episode was created. Returns null when the date
	 * is missing or doesn't parse, so callers can omit the property.
	 * @param isoDate
	 */
	function episodeAgeDays( isoDate ) {
		if ( typeof isoDate !== 'string' || isoDate === '' ) {
			return null;
		}
		const parsed = Date.parse( isoDate );
		if ( Number.isNaN( parsed ) ) {
			return null;
		}
		const ms = Date.now() - parsed;
		if ( ms < 0 ) {
			return 0;
		}
		return Math.floor( ms / ( 24 * 60 * 60 * 1000 ) );
	}

	function buildBanner( { state, title, message, upgradeUrl, quota, reset } ) {
		const banner = document.createElement( 'div' );
		banner.className = 'jetpack-create-ai-podcast__credits-banner';
		banner.dataset.state = state;

		const body = document.createElement( 'div' );
		body.className = 'jetpack-create-ai-podcast__credits-banner-body';

		const titleEl = document.createElement( 'p' );
		titleEl.className = 'jetpack-create-ai-podcast__credits-banner-title';
		titleEl.textContent = title;
		body.appendChild( titleEl );

		if ( message ) {
			const messageEl = document.createElement( 'p' );
			messageEl.className = 'jetpack-create-ai-podcast__credits-banner-message';
			messageEl.textContent = message;
			body.appendChild( messageEl );
		}

		banner.appendChild( body );

		if ( upgradeUrl ) {
			const cta = document.createElement( 'a' );
			cta.className = 'button button-primary jetpack-create-ai-podcast__credits-banner-cta';
			cta.href = upgradeUrl;
			cta.target = '_blank';
			cta.rel = 'noopener noreferrer';
			cta.textContent = data.i18n.upgradeCta;
			cta.addEventListener( 'click', () => {
				recordEvent( 'wpcom_create_ai_podcast_upgrade_clicked', {
					state,
					target_plan: targetPlanFromUrl( upgradeUrl ),
					credits_used: quota?.used ?? 0,
					credits_quota: quota?.quota ?? 0,
				} );
			} );
			banner.appendChild( cta );
		}

		recordEvent( 'wpcom_create_ai_podcast_quota_banner_shown', {
			state,
			has_upgrade_url: !! upgradeUrl,
			credits_remaining: quota?.remaining ?? 0,
			days_until_reset: reset ? reset.days : null,
		} );

		return banner;
	}

	/**
	 *
	 */
	function renderNotAvailable() {
		creditsEl.dataset.state = 'not-available';
		creditsEl.innerHTML = '';
		const text = document.createElement( 'p' );
		text.textContent = data.i18n.notAvailable;
		creditsEl.appendChild( text );
		form.hidden = true;
	}

	/**
	 *
	 * @param response
	 */
	function applyQuotaResponse( response ) {
		if ( ! response ) {
			lastQuotaSnapshot = null;
			renderCredits( { quota: 0, used: 0 }, '' );
			return null;
		}
		if ( response.notAvailable || response.error === 'not_available' ) {
			lastQuotaSnapshot = null;
			renderNotAvailable();
			return null;
		}
		const quota = response.quota ?? response;
		lastQuotaSnapshot = quota;
		renderCredits( quota, response.upgradeUrl ?? '' );
		return response;
	}

	async function refreshInfo() {
		try {
			const response = await apiCall( { path: data.endpoints.quota, method: 'GET' } );
			return applyQuotaResponse( response );
		} catch ( err ) {
			const status = err?.data?.status;
			if ( err?.code === 'rest_forbidden' || status === 403 || status === 404 ) {
				renderNotAvailable();
				return null;
			}
			renderCredits( { quota: 0, used: 0 }, '' );
			return null;
		}
	}

	// --- Posts picker -----------------------------------------------------------

	/**
	 *
	 * @param fn
	 * @param ms
	 */
	function debounce( fn, ms ) {
		let timer = null;
		return ( ...args ) => {
			window.clearTimeout( timer );
			timer = window.setTimeout( () => fn( ...args ), ms );
		};
	}

	/**
	 *
	 * @param posts
	 */
	function renderPosts( posts ) {
		postsRegion.innerHTML = '';
		if ( ! posts.length ) {
			const empty = document.createElement( 'p' );
			empty.textContent = data.i18n.noPostsFound;
			postsRegion.appendChild( empty );
			return;
		}
		const ul = document.createElement( 'ul' );
		posts.forEach( post => {
			const li = document.createElement( 'li' );
			const label = document.createElement( 'label' );
			const checkbox = document.createElement( 'input' );
			checkbox.type = 'checkbox';
			checkbox.dataset.id = String( post.id );
			checkbox.checked = selectedPostIds.has( post.id );
			checkbox.addEventListener( 'change', () => {
				if ( checkbox.checked ) {
					selectedPostIds.add( post.id );
				} else {
					selectedPostIds.delete( post.id );
				}
			} );

			const title = document.createElement( 'span' );
			title.textContent = post.title?.rendered || `#${ post.id }`;

			const date = document.createElement( 'span' );
			date.className = 'date';
			if ( post.date ) {
				const parsed = new Date( post.date );
				if ( ! Number.isNaN( parsed.getTime() ) ) {
					date.textContent = parsed.toLocaleDateString( undefined, {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					} );
				}
			}

			label.appendChild( checkbox );
			label.appendChild( title );
			label.appendChild( date );
			li.appendChild( label );
			ul.appendChild( li );
		} );
		postsRegion.appendChild( ul );
	}

	function renderPostsLoading() {
		postsRegion.innerHTML = '';
		const loading = document.createElement( 'p' );
		loading.className = 'jetpack-create-ai-podcast__posts-loading';
		loading.textContent = data.i18n.loadingPosts;
		postsRegion.appendChild( loading );
	}

	const fetchPosts = debounce( async query => {
		try {
			const posts = await apiCall( {
				path: `${
					data.endpoints.posts
				}?status=publish&per_page=20&_fields=id,title,date&search=${ encodeURIComponent( query ) }`,
				method: 'GET',
			} );
			renderPosts( Array.isArray( posts ) ? posts : [] );
		} catch {
			renderPosts( [] );
		}
	}, 300 );

	function onSearchPosts( query ) {
		renderPostsLoading();
		fetchPosts( query );
	}

	// --- Generate + poll --------------------------------------------------------

	/**
	 *
	 */
	function buildPayload() {
		const sourceMode = form.querySelector( 'input[name="source"]:checked' ).value;
		const payload = {
			length: form.length.value,
			voicePreset: form.voice.value,
		};
		const prompt = form.prompt.value.trim();
		if ( prompt ) {
			payload.prompt = prompt;
		}
		if ( sourceMode === 'window' ) {
			const preset = data.presets.window.find( p => p.id === form.window.value );
			if ( preset ) {
				payload.window = { unit: preset.unit, n: preset.n };
			}
		} else {
			payload.postIds = Array.from( selectedPostIds );
		}
		return { sourceMode, payload };
	}

	/**
	 * @param editUrl
	 */
	function onSucceeded( editUrl ) {
		setFormDisabled( false );
		setStatus( 'success', data.i18n.succeeded, {
			link: {
				href: editUrl,
				label: data.i18n.editDraft,
				onClick: () => {
					recordEvent( 'wpcom_create_ai_podcast_draft_opened', {
						source: 'success_toast',
					} );
				},
			},
		} );
		refreshInfo();
		refreshEpisodes();
	}

	/**
	 *
	 * @param err
	 */
	function isEmptyWindowError( err ) {
		const code = err?.code || '';
		const message = err?.message || '';
		return (
			code === 'no-posts-in-window' ||
			code === 'no_posts_in_window' ||
			code === 'no-posts-found' ||
			/no published posts/i.test( message )
		);
	}

	function onFailed( message, options = {} ) {
		setFormDisabled( false );
		const statusOptions = options.suppressRetry
			? undefined
			: {
					action: {
						label: data.i18n.tryAgain,
						onClick: clearStatus,
					},
			  };
		setStatus( 'error', message || data.i18n.failed, statusOptions );
	}

	/**
	 *
	 */
	function onTimedOut() {
		setFormDisabled( false );
		setStatus( 'error', data.i18n.timedOut, {
			action: {
				label: data.i18n.tryAgain,
				onClick: clearStatus,
			},
		} );
	}

	/**
	 *
	 * @param jobId
	 * @param startedAt
	 */
	function startPolling( jobId, startedAt ) {
		clearTimeout( pollTimer );
		const elapsed = Date.now() - startedAt;
		if ( elapsed > data.poll.timeoutMs ) {
			onTimedOut();
			return;
		}
		const intervalMs = elapsed < data.poll.switchMs ? data.poll.fastMs : data.poll.slowMs;
		pollTimer = window.setTimeout( () => pollOnce( jobId, startedAt ), intervalMs );
	}

	/**
	 *
	 * @param jobId
	 * @param startedAt
	 */
	async function pollOnce( jobId, startedAt ) {
		try {
			const response = await apiCall( {
				path: data.endpoints.job + jobId,
				method: 'GET',
			} );
			if ( response?.status === 'complete' ) {
				onSucceeded( response.editUrl );
				return;
			}
			if ( response?.status === 'failed' ) {
				const failureMessage = response.errorMessage || response.message;
				onFailed( failureMessage, {
					suppressRetry: isEmptyWindowError( {
						code: response.errorCode,
						message: failureMessage,
					} ),
				} );
				return;
			}
			startPolling( jobId, startedAt );
		} catch {
			onFailed();
		}
	}

	/**
	 * Derive the job's start time from the server's `createdAt` ISO-8601 string
	 * so the poll-rate switch + 5-minute timeout reflect real elapsed time, not
	 * client wall-clock at boot. Falls back to "now" when the timestamp is
	 * missing/malformed.
	 *
	 * @param createdAt
	 */
	function parseStartedAt( createdAt ) {
		if ( typeof createdAt !== 'string' ) {
			return Date.now();
		}
		const parsed = Date.parse( createdAt );
		return Number.isNaN( parsed ) ? Date.now() : parsed;
	}

	/**
	 *
	 * @param event
	 */
	async function onGenerate( event ) {
		event.preventDefault();
		setFormDisabled( true );
		setStatus( 'progress', data.i18n.submitting );

		const { sourceMode, payload } = buildPayload();
		if ( sourceMode === 'posts' && ! payload.postIds.length ) {
			setFormDisabled( false );
			setStatus( 'error', data.i18n.pickPosts );
			return;
		}

		recordEvent( 'wpcom_create_ai_podcast_generation_requested', {
			source: sourceMode,
			length: payload.length,
			voice_preset: payload.voicePreset,
			posts_count: Array.isArray( payload.postIds ) ? payload.postIds.length : 0,
			window_unit: payload.window?.unit || '',
			window_n: payload.window?.n || 0,
			has_prompt: !! payload.prompt,
			credits_remaining: lastQuotaSnapshot?.remaining ?? 0,
			credits_quota: lastQuotaSnapshot?.quota ?? 0,
		} );

		try {
			const response = await apiCall( {
				path: data.endpoints.enqueue,
				method: 'POST',
				data: payload,
			} );
			const jobId = response?.jobId;
			if ( typeof jobId !== 'number' ) {
				onFailed();
				return;
			}
			setStatus( 'progress', data.i18n.polling );
			startPolling( jobId, parseStartedAt( response.createdAt ) );
		} catch ( err ) {
			onFailed( err?.message, { suppressRetry: isEmptyWindowError( err ) } );
		}
	}

	// --- Episodes list ----------------------------------------------------------

	/**
	 * @param payload - Envelope { items, total, page, perPage, totalPages }.
	 */
	function renderEpisodes( payload ) {
		episodesState = normalizeEpisodesPayload( payload );
		episodesList.innerHTML = '';

		if ( episodesState.total === 0 ) {
			const empty = document.createElement( 'p' );
			empty.className = 'jetpack-create-ai-podcast__episodes-empty';
			empty.textContent = data.i18n.episodesEmpty;
			episodesList.appendChild( empty );
			return;
		}

		const list = document.createElement( 'ul' );
		list.className = 'jetpack-create-ai-podcast__episodes-items';

		episodesState.items.forEach( episode => {
			const row = document.createElement( 'li' );
			row.className = 'jetpack-create-ai-podcast__episode';

			const header = document.createElement( 'div' );
			header.className = 'jetpack-create-ai-podcast__episode-header';

			const title = document.createElement( 'span' );
			title.className = 'jetpack-create-ai-podcast__episode-title';
			title.textContent = episode.title || '';
			header.appendChild( title );

			const status = document.createElement( 'span' );
			status.className = 'jetpack-create-ai-podcast__episode-status';
			status.dataset.status = episode.status || '';
			status.textContent =
				episode.status === 'publish' ? data.i18n.statusPublished : data.i18n.statusDraft;
			header.appendChild( status );

			row.appendChild( header );

			if ( episode.mediaUrl ) {
				const player = document.createElement( episode.mediaType === 'video' ? 'video' : 'audio' );
				player.className = 'jetpack-create-ai-podcast__episode-player';
				player.controls = true;
				player.preload = 'none';
				const source = document.createElement( 'source' );
				source.src = episode.mediaUrl;
				if ( episode.mediaMime ) {
					source.type = episode.mediaMime;
				}
				player.appendChild( source );
				let playReported = false;
				player.addEventListener( 'play', () => {
					if ( playReported ) {
						return;
					}
					playReported = true;
					recordEvent( 'wpcom_create_ai_podcast_episode_played', {
						episode_id: episode.id,
						status: episode.status || '',
						episode_age_days: episodeAgeDays( episode.date ),
					} );
				} );
				row.appendChild( player );
			}

			if ( episode.editUrl ) {
				const actions = document.createElement( 'div' );
				actions.className = 'jetpack-create-ai-podcast__episode-actions';
				const edit = document.createElement( 'a' );
				edit.href = episode.editUrl;
				edit.className = 'jetpack-create-ai-podcast__episode-edit';
				edit.textContent = data.i18n.editPost;
				edit.addEventListener( 'click', () => {
					recordEvent( 'wpcom_create_ai_podcast_draft_opened', {
						source: 'episode_list',
						episode_id: episode.id,
						status: episode.status || '',
					} );
				} );
				actions.appendChild( edit );
				row.appendChild( actions );
			}

			list.appendChild( row );
		} );

		episodesList.appendChild( list );

		if ( episodesState.totalPages > 1 ) {
			episodesList.appendChild( buildEpisodesPager() );
		}
	}

	/**
	 * Build a numbered pager (Prev · 1 · 2 · 3 · Next) with elision when
	 * total pages exceed the visible window. Mirrors the wp-admin
	 * WP_List_Table interaction model: aria-current="page" on the active
	 * button, disabled state on Prev/Next at boundaries.
	 */
	function buildEpisodesPager() {
		const { page, perPage, total, totalPages } = episodesState;
		const nav = document.createElement( 'nav' );
		nav.className = 'jetpack-create-ai-podcast__pagination';
		nav.setAttribute( 'aria-label', data.i18n.paginationLabel );

		const start = total === 0 ? 0 : ( page - 1 ) * perPage + 1;
		const end = Math.min( total, page * perPage );

		const summary = document.createElement( 'span' );
		summary.className = 'jetpack-create-ai-podcast__pagination-summary';
		summary.textContent = sprintf( data.i18n.paginationSummary, start, end, total );
		nav.appendChild( summary );

		const controls = document.createElement( 'div' );
		controls.className = 'jetpack-create-ai-podcast__pagination-controls';

		const makeBtn = ( label, targetPage, options = {} ) => {
			const btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className =
				'jetpack-create-ai-podcast__pagination-button' +
				( options.kind ? ' jetpack-create-ai-podcast__pagination-button--' + options.kind : '' );
			btn.textContent = label;
			if ( options.ariaLabel ) {
				btn.setAttribute( 'aria-label', options.ariaLabel );
			}
			if ( options.current ) {
				btn.setAttribute( 'aria-current', 'page' );
				btn.disabled = true;
			}
			if ( options.disabled ) {
				btn.disabled = true;
			} else {
				btn.addEventListener( 'click', () => goToPage( targetPage ) );
			}
			return btn;
		};

		controls.appendChild(
			makeBtn( data.i18n.paginationPrev, page - 1, {
				kind: 'prev',
				disabled: page <= 1,
			} )
		);

		buildPageList( page, totalPages ).forEach( token => {
			if ( token === '…' ) {
				const ellipsis = document.createElement( 'span' );
				ellipsis.className = 'jetpack-create-ai-podcast__pagination-ellipsis';
				ellipsis.setAttribute( 'aria-hidden', 'true' );
				ellipsis.textContent = '…';
				controls.appendChild( ellipsis );
				return;
			}
			controls.appendChild(
				makeBtn( String( token ), token, {
					current: token === page,
					ariaLabel: sprintf( data.i18n.paginationGoTo, token ),
				} )
			);
		} );

		controls.appendChild(
			makeBtn( data.i18n.paginationNext, page + 1, {
				kind: 'next',
				disabled: page >= totalPages,
			} )
		);

		nav.appendChild( controls );
		return nav;
	}

	/**
	 * Compute the visible page tokens around the current page. Always shows
	 * first + last; adds an ellipsis when there's a gap. Keeps the control
	 * narrow even when there are dozens of pages.
	 *
	 * @param current - Current page (1-indexed).
	 * @param total   - Total page count.
	 */
	function buildPageList( current, total ) {
		if ( total <= 7 ) {
			return Array.from( { length: total }, ( _, i ) => i + 1 );
		}
		const tokens = [ 1 ];
		const windowStart = Math.max( 2, current - 1 );
		const windowEnd = Math.min( total - 1, current + 1 );
		if ( windowStart > 2 ) {
			tokens.push( '…' );
		}
		for ( let i = windowStart; i <= windowEnd; i++ ) {
			tokens.push( i );
		}
		if ( windowEnd < total - 1 ) {
			tokens.push( '…' );
		}
		tokens.push( total );
		return tokens;
	}

	async function goToPage( page ) {
		const clamped = Math.max( 1, Math.min( episodesState.totalPages || 1, page ) );
		if ( clamped === episodesState.page ) {
			return;
		}
		recordEvent( 'wpcom_create_ai_podcast_episodes_paginated', {
			page: clamped,
			total_pages: episodesState.totalPages,
		} );
		episodesSection.setAttribute( 'aria-busy', 'true' );
		renderEpisodesSkeleton();
		try {
			const response = await apiCall( {
				path: `${ data.endpoints.episodes }?page=${ clamped }&per_page=${ EPISODES_PER_PAGE }`,
				method: 'GET',
			} );
			renderEpisodes( response );
		} catch {
			renderEpisodes( null );
		} finally {
			episodesSection.setAttribute( 'aria-busy', 'false' );
		}
	}

	/**
	 *
	 */
	function renderEpisodesSkeleton() {
		episodesList.innerHTML = '';
		const list = document.createElement( 'ul' );
		list.className =
			'jetpack-create-ai-podcast__episodes-items jetpack-create-ai-podcast__episodes-items--skeleton';
		list.setAttribute( 'aria-hidden', 'true' );

		for ( let i = 0; i < 2; i++ ) {
			const row = document.createElement( 'li' );
			row.className = 'jetpack-create-ai-podcast__episode';

			const header = document.createElement( 'div' );
			header.className = 'jetpack-create-ai-podcast__episode-header';
			const titleSkel = document.createElement( 'span' );
			titleSkel.className =
				'jetpack-create-ai-podcast__skeleton jetpack-create-ai-podcast__skeleton--title';
			const statusSkel = document.createElement( 'span' );
			statusSkel.className =
				'jetpack-create-ai-podcast__skeleton jetpack-create-ai-podcast__skeleton--pill';
			header.appendChild( titleSkel );
			header.appendChild( statusSkel );
			row.appendChild( header );

			const player = document.createElement( 'span' );
			player.className =
				'jetpack-create-ai-podcast__skeleton jetpack-create-ai-podcast__skeleton--player';
			row.appendChild( player );

			const editSkel = document.createElement( 'span' );
			editSkel.className =
				'jetpack-create-ai-podcast__skeleton jetpack-create-ai-podcast__skeleton--link';
			row.appendChild( editSkel );

			list.appendChild( row );
		}

		episodesList.appendChild( list );

		const srOnly = document.createElement( 'span' );
		srOnly.className = 'screen-reader-text';
		srOnly.textContent = data.i18n.episodesLoading;
		episodesList.appendChild( srOnly );
	}

	async function refreshEpisodes() {
		episodesSection.setAttribute( 'aria-busy', 'true' );
		renderEpisodesSkeleton();

		let response;
		try {
			response = await apiCall( {
				path: `${ data.endpoints.episodes }?page=1&per_page=${ EPISODES_PER_PAGE }`,
				method: 'GET',
			} );
		} catch {
			response = null;
		}
		renderEpisodes( response );
		episodesSection.setAttribute( 'aria-busy', 'false' );
	}

	// --- Bootstrapping ----------------------------------------------------------

	/**
	 *
	 */
	function bindSourceToggle() {
		sourceRadios.forEach( radio => {
			radio.addEventListener( 'change', () => {
				const mode = form.querySelector( 'input[name="source"]:checked' ).value;
				windowSection.hidden = mode !== 'window';
				postsSection.hidden = mode !== 'posts';
				if ( mode === 'posts' && ! postsRegion.children.length ) {
					onSearchPosts( '' );
				}
			} );
		} );
	}

	/**
	 *
	 */
	function bindPostsSearch() {
		postsSearch.addEventListener( 'input', event => {
			onSearchPosts( event.target.value );
		} );
	}

	/**
	 *
	 */
	function bindGenerate() {
		form.addEventListener( 'submit', onGenerate );
	}

	/**
	 *
	 * @param jobId
	 * @param startedAt
	 */
	function resumePolling( jobId, startedAt ) {
		setFormDisabled( true );
		setStatus( 'progress', data.i18n.polling );
		startPolling( jobId, startedAt );
	}

	async function bootstrap() {
		// Bind form interactions in every path: even when we resume an
		// in-flight job and disable the form, the listeners need to be live
		// once the job finishes and re-enables it so the user can submit
		// again without a full page reload.
		bindSourceToggle();
		bindPostsSearch();
		bindGenerate();

		// All initial reads come from data.bootstrap, baked in server-side.
		// No initial network round-trip required.
		const info = applyQuotaResponse( bootstrapQuota );
		renderEpisodes( bootstrapEpisodes );
		episodesSection.setAttribute( 'aria-busy', 'false' );

		recordEvent( 'wpcom_create_ai_podcast_page_viewed', {
			feature_available: info !== null,
			credits_remaining: lastQuotaSnapshot?.remaining ?? 0,
			credits_quota: lastQuotaSnapshot?.quota ?? 0,
			episodes_total: episodesState.total,
		} );

		if ( ! info ) {
			return; // not-available banner already rendered.
		}

		// The localized bootstrap mirrors the GET endpoint's shape, including
		// `activeJob`, so we can resume polling without a client-side fetch.
		const activeJob = info.activeJob;
		if ( activeJob && typeof activeJob === 'object' && typeof activeJob.jobId === 'number' ) {
			resumePolling( activeJob.jobId, parseStartedAt( activeJob.createdAt ) );
		}
	}

	bootstrap();
} )();
