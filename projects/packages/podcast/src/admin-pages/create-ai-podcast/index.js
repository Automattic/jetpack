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

		const text = document.createElement( 'p' );
		text.textContent = message;
		card.appendChild( text );

		if ( options?.link ) {
			const a = document.createElement( 'a' );
			a.href = options.link.href;
			a.textContent = options.link.label;
			a.className = 'button button-secondary';
			card.appendChild( a );
		}

		if ( options?.action ) {
			const btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className = 'button';
			btn.textContent = options.action.label;
			btn.addEventListener( 'click', options.action.onClick );
			card.appendChild( btn );
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
			el.disabled = disabled;
		} );
	}

	// --- Quota ------------------------------------------------------------------

	/**
	 * @param quota
	 * @param upgradeUrl
	 */
	function renderCredits( quota, upgradeUrl ) {
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

		if ( quota?.resetsAt ) {
			const resetDate = new Date( quota.resetsAt );
			if ( ! Number.isNaN( resetDate.getTime() ) ) {
				const formatted = resetDate.toLocaleDateString( undefined, {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
				} );
				const meta = document.createElement( 'div' );
				meta.className = 'jetpack-create-ai-podcast__credits-meta';
				meta.textContent = sprintf( data.i18n.creditsReset, formatted );
				creditsEl.appendChild( meta );
			}
		}

		// Upgrade nudge when usage is high and the site has a higher tier
		// available. `upgradeUrl` is empty on Business+ so nothing renders there.
		const shouldNudge = upgradeUrl && ( remaining === 0 || ratio >= 0.7 );
		if ( shouldNudge ) {
			const nudge = document.createElement( 'div' );
			nudge.className = 'jetpack-create-ai-podcast__credits-upgrade';

			const message = document.createElement( 'span' );
			message.className = 'jetpack-create-ai-podcast__credits-upgrade-message';
			message.textContent =
				remaining === 0 ? data.i18n.upgradeOutOfCredits : data.i18n.upgradeRunningLow;

			const cta = document.createElement( 'a' );
			cta.className = 'button button-primary';
			cta.href = upgradeUrl;
			cta.target = '_blank';
			cta.rel = 'noopener noreferrer';
			cta.textContent = data.i18n.upgradeCta;

			nudge.appendChild( message );
			nudge.appendChild( cta );
			creditsEl.appendChild( nudge );
		}
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
	 */
	async function fetchInfo() {
		try {
			const response = await apiCall( { path: data.endpoints.quota, method: 'GET' } );
			if ( response?.notAvailable || response?.error === 'not_available' ) {
				renderNotAvailable();
				return null;
			}
			const quota = response?.quota ?? response;
			renderCredits( quota, response?.upgradeUrl ?? '' );
			return response;
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
			link: { href: editUrl, label: data.i18n.editDraft },
		} );
	}

	/**
	 *
	 * @param message
	 */
	function onFailed( message ) {
		setFormDisabled( false );
		setStatus( 'error', message || data.i18n.failed, {
			action: {
				label: data.i18n.tryAgain,
				onClick: clearStatus,
			},
		} );
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
				onFailed( response.errorMessage || response.message );
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
			setStatus( 'error', data.i18n.pickPosts, {
				action: { label: data.i18n.tryAgain, onClick: clearStatus },
			} );
			return;
		}

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
			onFailed( err?.message );
		}
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

		const info = await fetchInfo();
		if ( ! info ) {
			return; // not-available banner already rendered.
		}

		// The GET endpoint is now the single source of truth: it reports an
		// `activeJob` whenever one is still running for the current user.
		const activeJob = info.activeJob;
		if ( activeJob && typeof activeJob === 'object' && typeof activeJob.jobId === 'number' ) {
			resumePolling( activeJob.jobId, parseStartedAt( activeJob.createdAt ) );
		}
	}

	bootstrap();
} )();
