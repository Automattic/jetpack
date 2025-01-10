<?php ob_start(); ?>
<div
	data-wp-interactive="jetpack/instant-search"
	data-wp-router-region="jetpack/instant-search"
><template data-wp-each="state.display">
	<div
		aria-hidden="false"
		aria-labelledby="jetpack-instant-search__overlay-title"
		role="dialog"
		class="jetpack-instant-search jetpack-instant-search__overlay jetpack-instant-search__overlay--light"
	>
		<h1 id="jetpack-instant-search__overlay-title" class="screen-reader-text">Search results</h1>
		<div class="jetpack-instant-search__search-results-wrapper has-colophon">
			<div aria-hidden="false" class="jetpack-instant-search__search-results">
				<div role="form" class="jetpack-instant-search__search-results-controls">
					<form
						autocomplete="off"
						role="search"
						class="jetpack-instant-search__search-results-search-form"
					>
						<div class="jetpack-instant-search__search-form">
							<div class="jetpack-instant-search__box">
								<label
									for="jetpack-instant-search__box-input-1"
									class="jetpack-instant-search__box-label"
								>
									<div class="jetpack-instant-search__box-gridicon">
										<svg
											focusable="true"
											height="24"
											viewBox="0 0 24 24"
											width="24"
											xmlns="http://www.w3.org/2000/svg"
											aria-hidden="false"
											class="gridicon gridicons-search"
											style="height: 24px; width: 24px"
										>
											<title>Magnifying Glass</title>
											<g>
												<path
													d="M21 19l-5.154-5.154C16.574 12.742 17 11.42 17 10c0-3.866-3.134-7-7-7s-7 3.134-7 7 3.134 7 7 7c1.42 0 2.742-.426 3.846-1.154L19 21l2-2zM5 10c0-2.757 2.243-5 5-5s5 2.243 5 5-2.243 5-5 5-5-2.243-5-5z"
												></path>
											</g>
										</svg>
									</div>
									<input
										autocomplete="off"
										id="jetpack-instant-search__box-input-1"
										inputmode="search"
										placeholder="Search…"
										type="search"
										class="search-field jetpack-instant-search__box-input"
										data-wp-on-async--input="onSearchInput"
									><input type="button" value="clear"><button
										tabindex="-1"
										class="screen-reader-text assistive-text"
									>
										Search
									</button>
								</label>
							</div>
						</div>
					</form>
					<button
						tabindex="0"
						aria-label="Close search results"
						class="jetpack-instant-search__overlay-close"
						data-wp-on-async--click="handleClose"
					>
						<svg
							focusable="false"
							height="24"
							viewBox="0 0 24 24"
							width="24"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							class="gridicon gridicons-cross"
							style="height: 24px; width: 24px"
						>
							<title>Close search results</title>
							<g>
								<path
									d="M18.36 19.78L12 13.41l-6.36 6.37-1.42-1.42L10.59 12 4.22 5.64l1.42-1.42L12 10.59l6.36-6.36 1.41 1.41L13.41 12l6.36 6.36z"
								></path>
							</g>
						</svg>
					</button>
				</div>
				<div role="form" class="jetpack-instant-search__search-form-controls">
					<div
						role="button"
						tabindex="0"
						class="jetpack-instant-search__search-results-filter-button"
					>
						Filters<svg
							focusable="true"
							height="16"
							viewBox="0 0 24 24"
							width="16"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							class="gridicon gridicons-chevron-down"
							style="height: 16px; width: 16px"
						>
							<g>
								<path d="M20 9l-8 8-8-8 1.414-1.414L12 14.172l6.586-6.586"></path>
							</g></svg
						><span class="screen-reader-text assistive-text">Show filters</span>
					</div>
					<div
						aria-controls="jetpack-instant-search__search-results-content"
						class="jetpack-instant-search__search-sort jetpack-instant-search__search-sort-with-links"
					>
						<div class="screen-reader-text">Sort by:</div>
						<button
							aria-current="true"
							data-value="relevance"
							class="jetpack-instant-search__search-sort-option is-selected"
						>
							Relevance</button
						><span aria-hidden="true" class="jetpack-instant-search__search-sort-separator"
							>•</span
						><button
							aria-current="false"
							data-value="newest"
							class="jetpack-instant-search__search-sort-option"
						>
							Newest</button
						><span aria-hidden="true" class="jetpack-instant-search__search-sort-separator"
							>•</span
						><button
							aria-current="false"
							data-value="oldest"
							class="jetpack-instant-search__search-sort-option"
						>
							Oldest
						</button>
					</div>
				</div>
				<div
					aria-live="polite"
					id="jetpack-instant-search__search-results-content"
					class="jetpack-instant-search__search-results-content"
				>
					<div class="jetpack-instant-search__search-results-primary">
						<style>
							.jetpack-instant-search *::selection,
							.jetpack-instant-search
								.jetpack-instant-search__search-results
								.jetpack-instant-search__search-results-primary
								.jetpack-instant-search__search-result
								mark {
								color: black;
								background-color: #ffc;
							}
						</style>
						<h2 class="jetpack-instant-search__search-results-title">Showing popular results</h2>
						<ol class="jetpack-instant-search__search-results-list is-format-expanded">
							<li
								class="jetpack-instant-search__search-result jetpack-instant-search__search-result-expanded jetpack-instant-search__search-result-expanded--post jetpack-instant-search__search-result-expanded--no-image jetpack-instant-search__search-result-category--uncategorized"
							>
								<div class="jetpack-instant-search__search-result-expanded__content-container">
									<div class="jetpack-instant-search__search-result-expanded__copy-container">
										<h3
											class="jetpack-instant-search__search-result-title jetpack-instant-search__search-result-expanded__title"
										>
											<a
												href="https://example.com"
												class="jetpack-instant-search__search-result-title-link jetpack-instant-search__search-result-expanded__title-link"
												><span>a post</span></a
											>
										</h3>
										<div
											class="jetpack-instant-search__path-breadcrumb jetpack-instant-search__search-result-expanded__path"
										>
											<a
												href="https://example.com"
												tabindex="-1"
												aria-hidden="true"
												class="jetpack-instant-search__path-breadcrumb-link"
												><span class="jetpack-instant-search__path-breadcrumb-piece">2025 › </span
												><span class="jetpack-instant-search__path-breadcrumb-piece">01 › </span
												><span class="jetpack-instant-search__path-breadcrumb-piece">09 › </span
												><span class="jetpack-instant-search__path-breadcrumb-piece"
													>a-post</span
												></a
											>
										</div>
										<div class="jetpack-instant-search__search-result-expanded__content">
											number <mark>one</mark>
										</div>
									</div>
									<a
										href="https://example.com"
										tabindex="-1"
										aria-hidden="true"
										class="jetpack-instant-search__search-result-expanded__image-link"
									>
										<div
											class="jetpack-instant-search__search-result-expanded__image-container"
										></div>
									</a>
								</div>
								<ul class="jetpack-instant-search__search-result-expanded__footer">
									<li>
										<span class="jetpack-instant-search__search-result-expanded__footer-date"
											>Jan 9, 2025</span
										>
									</li>
								</ul>
							</li>
							<li
								class="jetpack-instant-search__search-result jetpack-instant-search__search-result-expanded jetpack-instant-search__search-result-expanded--post jetpack-instant-search__search-result-expanded--no-image jetpack-instant-search__search-result-category--uncategorized"
							>
								<div class="jetpack-instant-search__search-result-expanded__content-container">
									<div class="jetpack-instant-search__search-result-expanded__copy-container">
										<h3
											class="jetpack-instant-search__search-result-title jetpack-instant-search__search-result-expanded__title"
										>
											<a
												href="https://example.com"
												class="jetpack-instant-search__search-result-title-link jetpack-instant-search__search-result-expanded__title-link"
												><span>two</span></a
											>
										</h3>
										<div
											class="jetpack-instant-search__path-breadcrumb jetpack-instant-search__search-result-expanded__path"
										>
											<a
												href="https://example.com"
												tabindex="-1"
												aria-hidden="true"
												class="jetpack-instant-search__path-breadcrumb-link"
												><span class="jetpack-instant-search__path-breadcrumb-piece">2025 › </span
												><span class="jetpack-instant-search__path-breadcrumb-piece">01 › </span
												><span class="jetpack-instant-search__path-breadcrumb-piece">09 › </span
												><span class="jetpack-instant-search__path-breadcrumb-piece">two</span></a
											>
										</div>
										<div class="jetpack-instant-search__search-result-expanded__content">
											is after
											<mark>one</mark>
										</div>
									</div>
									<a
										href="https://example.com"
										tabindex="-1"
										aria-hidden="true"
										class="jetpack-instant-search__search-result-expanded__image-link"
									>
										<div
											class="jetpack-instant-search__search-result-expanded__image-container"
										></div>
									</a>
								</div>
								<ul class="jetpack-instant-search__search-result-expanded__footer">
									<li>
										<span class="jetpack-instant-search__search-result-expanded__footer-date"
											>Jan 9, 2025</span
										>
									</li>
								</ul>
							</li>
							<li
								class="jetpack-instant-search__search-result jetpack-instant-search__search-result-expanded jetpack-instant-search__search-result-expanded--page jetpack-instant-search__search-result-expanded--no-image"
							>
								<div class="jetpack-instant-search__search-result-expanded__content-container">
									<div class="jetpack-instant-search__search-result-expanded__copy-container">
										<h3
											class="jetpack-instant-search__search-result-title jetpack-instant-search__search-result-expanded__title"
										>
											<a
												href="https://example.com"
												class="jetpack-instant-search__search-result-title-link jetpack-instant-search__search-result-expanded__title-link"
												><span>Sample Page</span></a
											>
										</h3>
										<div
											class="jetpack-instant-search__path-breadcrumb jetpack-instant-search__search-result-expanded__path"
										>
											<a
												href="https://example.com"
												tabindex="-1"
												aria-hidden="true"
												class="jetpack-instant-search__path-breadcrumb-link"
												><span class="jetpack-instant-search__path-breadcrumb-piece"
													>sample-page</span
												></a
											>
										</div>
										<div class="jetpack-instant-search__search-result-expanded__content">
											different from a blog post because it will stay in <mark>one</mark> place
											and will show up in your site navigation (in
										</div>
									</div>
									<a
										href="https://example.com"
										tabindex="-1"
										aria-hidden="true"
										class="jetpack-instant-search__search-result-expanded__image-link"
									>
										<div
											class="jetpack-instant-search__search-result-expanded__image-container"
										></div>
									</a>
								</div>
								<ul class="jetpack-instant-search__search-result-expanded__footer">
									<li>
										<span class="jetpack-instant-search__search-result-expanded__footer-date"
											>Jan 9, 2025</span
										>
									</li>
								</ul>
							</li>
						</ol>
					</div>
					<div class="jetpack-instant-search__search-results-secondary">
						<div class="jetpack-instant-search__sidebar">
							<div class="jetpack-instant-search__search-filters">
								<h2 class="jetpack-instant-search__search-filters-title">Filter options</h2>
							</div>
							<div class="jetpack-instant-search__widget-area-container">
								<div class="jetpack-instant-search__widget-area" style="">
									<div id="jetpack-search-filters-1" class="widget jetpack-filters widget_search">
										<div
											id="jetpack-search-filters-1-wrapper"
											class="jetpack-instant-search-wrapper"
										>
											<div
												id="jetpack-search-filters-1-portaled-wrapper"
												class="jetpack-instant-search__portaled-wrapper"
											>
												<div class="jetpack-instant-search__search-filters">
													<div id="jetpack-instant-search__search-filter-2-taxonomy">
														<h3 class="jetpack-instant-search__search-filter-sub-heading">
															Categories
														</h3>
														<div>
															<div
																class="jetpack-instant-search__search-filter-list jetpack-instant-search__search-static-filter-list jetpack-instant-search__search-static-filter-variation-undefined"
															></div>
															<div class="jetpack-instant-search__search-filter-list">
																<div>
																	<input
																		id="jetpack-instant-search__search-filter-2-taxonomies-uncategorized"
																		name="uncategorized"
																		type="checkbox"
																		class="jetpack-instant-search__search-filter-list-input"
																	><label
																		for="jetpack-instant-search__search-filter-2-taxonomies-uncategorized"
																		class="jetpack-instant-search__search-filter-list-label"
																		>Uncategorized (2)</label
																	>
																</div>
															</div>
														</div>
													</div>
													<div id="jetpack-instant-search__search-filter-3-date">
														<h3 class="jetpack-instant-search__search-filter-sub-heading">
															Year
														</h3>
														<div>
															<div
																class="jetpack-instant-search__search-filter-list jetpack-instant-search__search-static-filter-list jetpack-instant-search__search-static-filter-variation-undefined"
															></div>
															<div class="jetpack-instant-search__search-filter-list">
																<div>
																	<input
																		id="jetpack-instant-search__search-filter-3-dates-year_post_date-2025-01-01 00:00:00"
																		name="2025-01-01 00:00:00"
																		type="checkbox"
																		class="jetpack-instant-search__search-filter-list-input"
																	><label
																		for="jetpack-instant-search__search-filter-3-dates-year_post_date-2025-01-01 00:00:00"
																		class="jetpack-instant-search__search-filter-list-label"
																		>2025 (3)</label
																	>
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<button id="jetpack-instant-search__overlay-focus-anchor">Close Search</button>
			</div>
			<details open><summary>debug</summary><pre data-wp-text="state.debugResult"></pre></details>
			<div class="jetpack-instant-search__jetpack-colophon">
				<a
					href="https://jetpack.com/upgrade/search/?utm_source=poweredby"
					rel="external noopener noreferrer nofollow"
					target="_blank"
					class="jetpack-instant-search__jetpack-colophon-link"
					><svg
						height="12"
						width="12"
						viewBox="0 0 32 32"
						class="jetpack-instant-search__jetpack-colophon-logo"
					>
						<path
							fill="#069e08"
							d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z"
							class="jetpack-logo__icon-circle"
						></path>
						<polygon
							fill="#fff"
							points="15,19 7,19 15,3 "
							class="jetpack-logo__icon-triangle"
						></polygon>
						<polygon
							fill="#fff"
							points="17,29 17,13 25,13 "
							class="jetpack-logo__icon-triangle"
						></polygon></svg
					><span class="jetpack-instant-search__jetpack-colophon-text"
						>Search powered by Jetpack</span
					></a
				>
			</div>
		</div>
	</div>
</template></div>
<?php
return ob_get_clean();
