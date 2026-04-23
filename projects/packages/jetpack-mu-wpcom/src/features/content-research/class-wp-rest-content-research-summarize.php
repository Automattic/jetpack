<?php
/**
 * WP_REST_Content_Research_Summarize file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class WP_REST_Content_Research_Summarize.
 *
 * Handles the /wpcom/v2/content-research/summarize endpoint.
 * Fetches article content, converts to markdown, and summarizes via AIServices.
 */
class WP_REST_Content_Research_Summarize extends \WP_REST_Controller {

	/**
	 * Maximum characters per article after HTML-to-markdown conversion.
	 */
	private const MAX_ARTICLE_LENGTH = 5000;

	/**
	 * Maximum combined characters before switching to chunk-then-condense.
	 */
	private const MAX_COMBINED_LENGTH = 30000;

	/**
	 * Maximum number of articles to fetch and summarize.
	 */
	private const MAX_ARTICLES = 5;

	/**
	 * WP_REST_Content_Research_Summarize constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'content-research/summarize';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'summarize' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'topic'   => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'results' => array(
						'type'     => 'array',
						'required' => true,
						'items'    => array(
							'type' => 'object',
						),
					),
				),
			)
		);
	}

	/**
	 * Check if the current user has permission to use the summarize endpoint.
	 *
	 * @return bool|\WP_Error
	 */
	public function check_permission() {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'You must be logged in to use this endpoint.', 'jetpack-mu-wpcom' ),
				array( 'status' => 401 )
			);
		}

		return true;
	}

	/**
	 * Summarize research results by fetching article content and using AIServices.
	 *
	 * @param \WP_REST_Request $request The incoming request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function summarize( \WP_REST_Request $request ) {
		$topic   = $request->get_param( 'topic' );
		$results = $request->get_param( 'results' );

		$articles = $this->fetch_articles( $results );

		// Check if any articles have fetched content.
		$has_content = false;
		foreach ( $articles as $article ) {
			if ( ! empty( $article['content'] ) ) {
				$has_content = true;
				break;
			}
		}

		// If no content was fetched, fall back to excerpts only.
		if ( ! $has_content ) {
			foreach ( $articles as &$article ) {
				$article['content'] = $article['excerpt'] ?? '';
			}
			unset( $article );
		}

		$combined_length = 0;
		foreach ( $articles as $article ) {
			$combined_length += strlen( $article['content'] );
		}

		if ( $combined_length > self::MAX_COMBINED_LENGTH ) {
			$result = $this->chunk_and_condense( $topic, $articles );
		} else {
			$prompt = $this->build_prompt( $topic, $articles );
			$result = $this->summarize_with_llm( $prompt );
		}

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Fetch and process article content for each result.
	 *
	 * @param array $results The search results.
	 * @return array Articles with fetched content.
	 */
	private function fetch_articles( array $results ): array {
		$articles = array();

		foreach ( array_slice( $results, 0, self::MAX_ARTICLES ) as $result ) {
			$url    = $result['url'] ?? '';
			$title  = $result['title'] ?? '';
			$source = $result['source'] ?? 'unknown';

			$article = array(
				'url'        => $url,
				'title'      => $title,
				'source'     => $source,
				'excerpt'    => $result['excerpt'] ?? '',
				'engagement' => $result['engagement'] ?? null,
				'content'    => '',
			);

			if ( ! empty( $url ) ) {
				$content = $this->fetch_article_content( $url );
				if ( ! empty( $content ) ) {
					$article['content'] = $content;
				}
			}

			$articles[] = $article;
		}

		return $articles;
	}

	/**
	 * Fetch a single article's content, extract main content, and convert to markdown.
	 *
	 * @param string $url The article URL.
	 * @return string The markdown content, or empty string on failure.
	 */
	private function fetch_article_content( string $url ): string {
		// Skip Google News wrapper URLs — they use JS redirects and encrypted URL encoding,
		// so we can't extract content server-side. Excerpts will be used instead.
		if ( strpos( $url, 'news.google.com/' ) !== false ) {
			return '';
		}

		$response = wp_safe_remote_get( $url, array( 'timeout' => 10 ) );

		if ( is_wp_error( $response ) ) {
			return '';
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			return '';
		}

		$html = wp_remote_retrieve_body( $response );
		if ( empty( $html ) ) {
			return '';
		}

		$main_html = $this->extract_main_content( $html );
		if ( empty( $main_html ) ) {
			return '';
		}

		require_lib( 'vectorize' );
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Loaded dynamically via require_lib.
		$converter = new \A8C\Vectorize\Html_To_Markdown();
		$markdown  = $converter->convert( $main_html ); // @phan-suppress-current-line PhanUndeclaredClassMethod

		// Truncate to max article length.
		if ( strlen( $markdown ) > self::MAX_ARTICLE_LENGTH ) {
			$markdown = substr( $markdown, 0, self::MAX_ARTICLE_LENGTH ) . '...';
		}

		return $markdown;
	}

	/**
	 * Extract the main content from an HTML document.
	 *
	 * Looks for <article>, falls back to <main>, then <body>.
	 *
	 * @param string $html The full HTML document.
	 * @return string The inner HTML of the main content element.
	 */
	private function extract_main_content( string $html ): string {
		$doc = new \DOMDocument();

		// Suppress warnings from malformed HTML.
		libxml_use_internal_errors( true );
		$doc->loadHTML( '<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
		libxml_clear_errors();

		// Try <article> first, then <main>, then <body>.
		$tags = array( 'article', 'main', 'body' );
		foreach ( $tags as $tag ) {
			$elements = $doc->getElementsByTagName( $tag );
			if ( $elements->length > 0 ) {
				$element    = $elements->item( 0 );
				$inner_html = '';
				foreach ( $element->childNodes as $child ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					$inner_html .= $doc->saveHTML( $child );
				}
				return $inner_html;
			}
		}

		return '';
	}

	/**
	 * Build the prompt for the AI summarization.
	 *
	 * @param string $topic    The research topic.
	 * @param array  $articles The articles with fetched content.
	 * @return string The formatted prompt.
	 */
	private function build_prompt( string $topic, array $articles ): string {
		$formatted_articles = '';
		foreach ( $articles as $article ) {
			$source = strtoupper( $article['source'] );
			$title  = $article['title'];
			$url    = $article['url'];

			$formatted_articles .= "[$source] $title ($url)\n";

			if ( ! empty( $article['engagement'] ) ) {
				$upvotes             = $article['engagement']['upvotes'] ?? 0;
				$comments            = $article['engagement']['comments'] ?? 0;
				$formatted_articles .= "  Engagement: {$upvotes} upvotes, {$comments} comments\n";
			}

			if ( ! empty( $article['content'] ) ) {
				$formatted_articles .= "--- Article Content ---\n" . $article['content'] . "\n--- End Content ---\n";
			}

			$formatted_articles .= "\n";
		}

		return "You are a research assistant helping a blogger write a post about: \"$topic\"\n\n"
			. "Here are recent articles from across the web with their full content:\n\n"
			. $formatted_articles
			. "Write a research brief in markdown using exactly this structure:\n\n"
			. "## Summary\n\n"
			. "2-3 paragraphs summarizing the current discourse around this topic.\n\n"
			. "## Key Findings\n\n"
			. "- 3-5 bullet points (use - for each)\n\n"
			. "## Suggested Angles\n\n"
			. "- 2-3 blog post angle ideas (use - for each)\n\n"
			. 'Write in plain markdown only. No code fences, no JSON.';
	}

	/**
	 * Call AIServices to summarize content.
	 *
	 * @param string $prompt The prompt to send to the LLM.
	 * @return array|\WP_Error Parsed summary data or error.
	 */
	private function summarize_with_llm( string $prompt ) {
		require_lib( 'ai-services' );
		$ai = new \AIServices( 'content-research' );

		$response = $ai->call_llm( $prompt );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $this->parse_markdown_response( $response );
	}

	/**
	 * Parse the markdown response from the LLM into structured sections.
	 *
	 * @param string $response The raw markdown response.
	 * @return array Parsed summary data with summary, key_findings, and suggested_angles.
	 */
	private function parse_markdown_response( string $response ): array {
		$summary          = '';
		$key_findings     = array();
		$suggested_angles = array();

		// Split by ## headings.
		$sections = preg_split( '/^##\s+/m', $response );

		foreach ( $sections as $section ) {
			$section = trim( $section );
			if ( empty( $section ) ) {
				continue;
			}

			// Extract the heading (first line) and body (rest).
			$lines   = explode( "\n", $section, 2 );
			$heading = strtolower( trim( $lines[0] ) );
			$body    = trim( $lines[1] ?? '' );

			if ( strpos( $heading, 'summary' ) !== false ) {
				$summary = $body;
			} elseif ( strpos( $heading, 'key finding' ) !== false ) {
				$key_findings = $this->parse_bullet_list( $body );
			} elseif ( strpos( $heading, 'suggested angle' ) !== false ) {
				$suggested_angles = $this->parse_bullet_list( $body );
			}
		}

		// Fallback: if no sections were parsed, return the whole response as summary.
		if ( empty( $summary ) && empty( $key_findings ) ) {
			$summary = $response;
		}

		return array(
			'summary'          => $summary,
			'key_findings'     => $key_findings,
			'suggested_angles' => $suggested_angles,
		);
	}

	/**
	 * Parse a markdown bullet list into an array of strings.
	 *
	 * @param string $text The bullet list text.
	 * @return array Array of bullet point strings.
	 */
	private function parse_bullet_list( string $text ): array {
		$items = array();
		$lines = explode( "\n", $text );

		foreach ( $lines as $line ) {
			$line = trim( $line );
			// Match lines starting with -, *, or numbered lists.
			if ( preg_match( '/^[-*]\s+(.+)$/', $line, $matches ) ) {
				$items[] = $matches[1];
			} elseif ( preg_match( '/^\d+[.)]\s+(.+)$/', $line, $matches ) ) {
				$items[] = $matches[1];
			}
		}

		return $items;
	}

	/**
	 * Chunk-then-condense: summarize each article individually, then produce a final summary.
	 *
	 * Used when combined article content exceeds MAX_COMBINED_LENGTH.
	 *
	 * @param string $topic    The research topic.
	 * @param array  $articles The articles with fetched content.
	 * @return array|\WP_Error Parsed summary data or error.
	 */
	private function chunk_and_condense( string $topic, array $articles ) {
		require_lib( 'ai-services' );
		$ai = new \AIServices( 'content-research' );

		$per_article_summaries = array();

		foreach ( $articles as $article ) {
			$source = strtoupper( $article['source'] );
			$title  = $article['title'];

			$chunk_prompt = "Summarize the following article in 2-3 sentences.\n\n"
				. "Title: $title (Source: $source)\n\n"
				. $article['content'];

			$summary = $ai->call_llm( $chunk_prompt );

			if ( is_wp_error( $summary ) ) {
				// Skip failed individual summaries.
				continue;
			}

			$per_article_summaries[] = "[$source] $title: $summary";
		}

		if ( empty( $per_article_summaries ) ) {
			return new \WP_Error(
				'summarize_failed',
				'Failed to generate any article summaries.',
				array( 'status' => 500 )
			);
		}

		// Condense the per-article summaries into the final output.
		$condensed_input = implode( "\n\n", $per_article_summaries );

		$final_prompt = "You are a research assistant helping a blogger write a post about: \"$topic\"\n\n"
			. "Here are summaries of recent articles on this topic:\n\n"
			. $condensed_input . "\n\n"
			. "Write a research brief in markdown using exactly this structure:\n\n"
			. "## Summary\n\n"
			. "2-3 paragraphs summarizing the current discourse around this topic.\n\n"
			. "## Key Findings\n\n"
			. "- 3-5 bullet points (use - for each)\n\n"
			. "## Suggested Angles\n\n"
			. "- 2-3 blog post angle ideas (use - for each)\n\n"
			. 'Write in plain markdown only. No code fences, no JSON.';

		return $this->summarize_with_llm( $final_prompt );
	}
}
