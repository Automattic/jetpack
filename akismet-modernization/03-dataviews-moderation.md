# Akismet UI Exploration — Plan 3: Activity Log

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read [README.md](./README.md), [strategy.md](./strategy.md), and [00-foundation.md](./00-foundation.md) first. Plan 0 must be merged before this one starts. Plan 2 isn't strictly required, but the deep-link from Overview cards into this Activity log is the intended drill-down — best to land them in order.

**Goal:** A single `@wordpress/dataviews`-powered table covering every blocked or challenged event on the site, regardless of source. One row schema. One filter for category. Comment spam is one row shape among six. The Activity log is where the pivot becomes most concrete: a comment caught by Akismet content rules and a checkout blocked by Blackbox velocity rules sit on adjacent rows, with adjacent treatment.

**Architecture:** New tab `?page=akismet-experimental&tab=activity`. Body is a `<DataViews>` instance bound to one new REST endpoint `akismet/v1/activity` that returns a union of rows from multiple sources, each with the same shape. Comment spam rows come from `WP_Comment_Query` with `comment_approved = 'spam'` (real data). Other categories come from category-specific adapters in PHP, falling back to deterministic mocks with `preview: true` until upstream signal sources wire up. Filters: category, outcome, source, date range, search. Persistent view state in `localStorage`. Row drawer (`<Modal>`) shows the per-row reasoning: which Akismet content rules fired, which Blackbox signals fired, IP, `visitor_id` when present.

**Gating:** lives on `?page=akismet-experimental` from Plan 0. Legacy core `edit-comments.php?comment_status=spam` flow is untouched.

**Blackbox per-row enrichment (additive):** when a comment-spam row has a stored `_blackbox_session_id` meta value, the drawer also shows the per-session Blackbox report (verdict, signals, prior history). When the meta is absent, the drawer renders without it. Capturing `_blackbox_session_id` at comment time is out of scope for this plan — it's a coordination ask flagged in the README.

**Tech Stack:** `@wordpress/dataviews` (fields, filters, views, actions), `@wordpress/components` (Modal, Badge), TanStack React Query with `keepPreviousData` for pagination, `apiFetch` for action calls.

---

## The unified row schema

Every row in the Activity table — comment spam, blocked checkout, challenged login, flagged form submission, blocked bot — uses the same shape:

```ts
export type ActivityRow = {
  id: string;                    // globally unique: `${ source }-${ source_id }`
  timestamp: string;             // ISO 8601 in UTC
  category: 'comments' | 'forms' | 'logins' | 'checkouts' | 'bots' | 'brute-force';
  source: 'akismet-content' | 'blackbox-behavioral' | 'blackbox-fingerprint' | 'blackbox-edge' | 'woocommerce-fraud' | 'akismet-rules';
  outcome: 'block' | 'challenge-passed' | 'challenge-failed' | 'allowed-but-flagged';
  subject: {
    kind: 'comment' | 'visitor' | 'order' | 'login-attempt' | 'form-submission';
    label: string;               // human-readable: "John Doe" or "Order #1042" or "IP 1.2.3.4"
    secondary?: string;          // optional 2nd line: email, post title, URL
    link?: string;               // wp-admin link when applicable
  };
  signals: Array< {              // What triggered the outcome.
    name: string;                // e.g. "akismet_high_confidence", "blackbox_velocity_threshold"
    weight: number;              // log-odds when from Blackbox; coarse priority otherwise
    description?: string;
  } >;
  ip?: string;
  visitor_id?: string;           // Blackbox cross-session identity, when known
  context: Record< string, unknown >;  // category-specific extras (cart_value for checkouts, etc.)
  preview: boolean;              // true → mocked entry; show a "preview data" badge
};
```

Why this shape works for every category:

- **`subject.kind`** decouples "what was this about" from "who/what classified it." A comment row has `kind: 'comment'`; a fraud row has `kind: 'order'`. The DataViews fields render `subject.label` + `subject.secondary` identically.
- **`signals`** is the join with the row drawer. Akismet content rules become signals. Blackbox rules become signals. The drawer renders them the same way.
- **`source`** + **`category`** are separately filterable. A user can ask "show me everything caught by Blackbox" or "show me everything in Checkouts."
- **`preview`** flag lets us mix real + mocked rows in the same table without lying.

---

## File structure

```
src/
├── routes/
│   ├── activity-tab.tsx                      # NEW — entry
│   └── activity/
│       ├── fields.tsx                        # NEW — DataViews field definitions for ActivityRow
│       ├── filters.ts                        # NEW — category / outcome / source / date filter configs
│       ├── views.ts                          # NEW — default + persisted view state
│       ├── actions.tsx                       # NEW — row + bulk actions (comment-specific, conditional)
│       ├── row-drawer.tsx                    # NEW — Modal: subject details + signals + Blackbox report
│       ├── blackbox-report-panel.tsx         # NEW — per-row Blackbox verdict panel
│       └── activity-types.ts                 # NEW — ActivityRow type definition
├── hooks/
│   ├── use-activity.ts                       # NEW — wraps GET akismet/v1/activity with pagination
│   └── use-blackbox-row-verdict.ts           # NEW — wraps GET akismet/v1/blackbox/verdict/{session_id}
├── lib/
│   └── activity-row-adapters.ts              # NEW — shape comments / orders / etc. into ActivityRow
└── styles/
    └── activity.scss                         # NEW

# PHP changes
class.akismet-experimental.php                # MODIFIED — register akismet/v1/activity + akismet/v1/blackbox/verdict
class.akismet-experimental-activity.php       # NEW — Akismet_Experimental_Activity: union query across sources

tests/js/
├── routes/activity/
│   ├── activity-tab.test.tsx
│   ├── fields.test.tsx
│   └── row-drawer.test.tsx
└── hooks/
    └── use-activity.test.tsx
```

---

## Tasks

### Task 1: Branch + scope

- [ ] **Step 1: Branch off trunk**

  ```bash
  cd ~/Code/wpcom
  git checkout trunk
  git pull
  git checkout -b akismet/experimental-ui-activity-log
  ```

### Task 2: Server — `GET /akismet/v1/activity`

**Files:**
- Create: `wp-content/mu-plugins/akismet-3.0/class.akismet-experimental-activity.php`
- Modify: `wp-content/mu-plugins/akismet-3.0/class.akismet-experimental.php`
- Create: `wp-content/mu-plugins/akismet-3.0/tests/phpunit/test-rest-activity.php`

The endpoint returns a **union** across sources. For Plan 3:

- **Comments** — real query via `WP_Comment_Query` (`comment_approved = 'spam'`), enriched with `_akismet_score` + `akismet_history` meta.
- **Forms, Logins, Bots, Brute-force** — deterministic mock rows (seeded; same call returns same rows). Each row carries `preview: true`.
- **Checkouts** — real query against WooCommerce orders + WFP meta *when WC + WFP are installed*. Mocked otherwise with `preview: true`.

Query params:

| Param | Type | Default |
| --- | --- | --- |
| `page` | int | 1 |
| `per_page` | int (max 100) | 25 |
| `category` | enum (or `all`) | `all` |
| `outcome` | enum (or `all`) | `all` |
| `source` | enum (or `all`) | `all` |
| `search` | string | `''` |
| `from` | ISO date | unset |
| `to` | ISO date | unset |

Response:

```json
{
  "items": [ /* ActivityRow[] */ ],
  "total": 142,
  "total_pages": 6,
  "page": 1,
  "per_page": 25
}
```

- [ ] **Step 1: PHPUnit test (TDD)**

  Create `wp-content/mu-plugins/akismet-3.0/tests/phpunit/test-rest-activity.php`:

  ```php
  <?php
  /**
   * @package Akismet
   */

  class Test_REST_Activity extends WP_UnitTestCase {

      protected function dispatch( $url, $params = array() ) {
          $request = new WP_REST_Request( 'GET', $url );
          foreach ( $params as $k => $v ) {
              $request->set_param( $k, $v );
          }
          wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
          return rest_get_server()->dispatch( $request );
      }

      public function set_up() {
          parent::set_up();
          if ( ! defined( 'AKISMET_EXPERIMENTAL_UI' ) ) {
              define( 'AKISMET_EXPERIMENTAL_UI', true );
          }
          Akismet_Experimental::init();
          do_action( 'rest_api_init' );
      }

      public function test_returns_at_least_mocked_rows_when_no_real_data() {
          $response = $this->dispatch( '/akismet/v1/activity' );
          $this->assertSame( 200, $response->get_status() );
          $data = $response->get_data();
          // Forms / Logins / Bots / Brute-force ship deterministic mock rows.
          $this->assertGreaterThan( 0, $data[ 'total' ] );
      }

      public function test_includes_real_comment_spam_rows() {
          $comment_id = self::factory()->comment->create( array(
              'comment_approved' => 'spam',
              'comment_content'  => 'find-me-needle',
          ) );
          update_comment_meta( $comment_id, '_akismet_score', '0.91' );

          $response = $this->dispatch( '/akismet/v1/activity', array( 'category' => 'comments' ) );
          $data = $response->get_data();

          $found = false;
          foreach ( $data[ 'items' ] as $row ) {
              if ( $row[ 'category' ] === 'comments' && ! $row[ 'preview' ] ) {
                  $this->assertSame( 'akismet-content', $row[ 'source' ] );
                  $this->assertSame( 'block', $row[ 'outcome' ] );
                  $found = true;
              }
          }
          $this->assertTrue( $found, 'Expected at least one real comment-spam row.' );
      }

      public function test_filter_by_category() {
          $response = $this->dispatch( '/akismet/v1/activity', array( 'category' => 'logins' ) );
          $data = $response->get_data();
          foreach ( $data[ 'items' ] as $row ) {
              $this->assertSame( 'logins', $row[ 'category' ] );
          }
      }

      public function test_filter_by_outcome() {
          $response = $this->dispatch( '/akismet/v1/activity', array( 'outcome' => 'challenge-passed' ) );
          $data = $response->get_data();
          foreach ( $data[ 'items' ] as $row ) {
              $this->assertSame( 'challenge-passed', $row[ 'outcome' ] );
          }
      }

      public function test_pagination_metadata_present() {
          $response = $this->dispatch( '/akismet/v1/activity', array( 'per_page' => 5 ) );
          $data = $response->get_data();
          $this->assertSame( 5, $data[ 'per_page' ] );
          $this->assertGreaterThanOrEqual( 1, $data[ 'total_pages' ] );
      }

      public function test_unauthorized_user_is_rejected() {
          $request = new WP_REST_Request( 'GET', '/akismet/v1/activity' );
          wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
          $response = rest_get_server()->dispatch( $request );
          $this->assertSame( 403, $response->get_status() );
      }
  }
  ```

  Run, expect 5 failures (route not registered).

- [ ] **Step 2: Implement `Akismet_Experimental_Activity`**

  Create `wp-content/mu-plugins/akismet-3.0/class.akismet-experimental-activity.php`:

  ```php
  <?php
  /**
   * Akismet experimental UI — Activity log union-query.
   *
   * @package Akismet
   */

  defined( 'ABSPATH' ) || exit;

  class Akismet_Experimental_Activity {

      const CATEGORIES = array( 'comments', 'forms', 'logins', 'checkouts', 'bots', 'brute-force' );
      const OUTCOMES   = array( 'block', 'challenge-passed', 'challenge-failed', 'allowed-but-flagged' );
      const SOURCES    = array( 'akismet-content', 'blackbox-behavioral', 'blackbox-fingerprint', 'blackbox-edge', 'woocommerce-fraud', 'akismet-rules' );

      /**
       * Build the unified activity list, applying filters.
       *
       * @param array $args category, outcome, source, search, from, to, page, per_page
       * @return array { items, total, page, per_page, total_pages }
       */
      public static function query( array $args ) {
          $category = $args[ 'category' ] ?? 'all';
          $rows = array();

          if ( in_array( $category, array( 'all', 'comments' ), true ) ) {
              $rows = array_merge( $rows, self::query_comments( $args ) );
          }
          if ( in_array( $category, array( 'all', 'checkouts' ), true ) ) {
              $rows = array_merge( $rows, self::query_checkouts( $args ) );
          }
          // Mocked categories: ship deterministic rows so the UI is testable end-to-end.
          foreach ( array( 'forms', 'logins', 'bots', 'brute-force' ) as $mocked ) {
              if ( in_array( $category, array( 'all', $mocked ), true ) ) {
                  $rows = array_merge( $rows, self::query_mocked( $mocked, $args ) );
              }
          }

          // Apply secondary filters that span sources.
          if ( ! empty( $args[ 'outcome' ] ) && $args[ 'outcome' ] !== 'all' ) {
              $rows = array_values( array_filter( $rows, fn( $r ) => $r[ 'outcome' ] === $args[ 'outcome' ] ) );
          }
          if ( ! empty( $args[ 'source' ] ) && $args[ 'source' ] !== 'all' ) {
              $rows = array_values( array_filter( $rows, fn( $r ) => $r[ 'source' ] === $args[ 'source' ] ) );
          }
          if ( ! empty( $args[ 'search' ] ) ) {
              $needle = strtolower( $args[ 'search' ] );
              $rows = array_values( array_filter( $rows, function ( $r ) use ( $needle ) {
                  return strpos( strtolower( $r[ 'subject' ][ 'label' ] . ' ' . ( $r[ 'subject' ][ 'secondary' ] ?? '' ) ), $needle ) !== false;
              } ) );
          }

          // Sort newest first.
          usort( $rows, fn( $a, $b ) => strcmp( $b[ 'timestamp' ], $a[ 'timestamp' ] ) );

          $page     = max( 1, (int) ( $args[ 'page' ] ?? 1 ) );
          $per_page = max( 1, min( 100, (int) ( $args[ 'per_page' ] ?? 25 ) ) );
          $total    = count( $rows );
          $offset   = ( $page - 1 ) * $per_page;
          $items    = array_slice( $rows, $offset, $per_page );

          return array(
              'items'       => $items,
              'total'       => $total,
              'page'        => $page,
              'per_page'    => $per_page,
              'total_pages' => (int) ceil( $total / $per_page ),
          );
      }

      protected static function query_comments( array $args ): array {
          $q = new WP_Comment_Query();
          $comments = $q->query( array(
              'status'  => 'spam',
              'number'  => 200, // cap; we paginate in PHP at the union level
              'orderby' => 'comment_date_gmt',
              'order'   => 'DESC',
          ) );
          $rows = array();
          foreach ( $comments as $c ) {
              $score   = (float) get_comment_meta( $c->comment_ID, '_akismet_score', true );
              $history = Akismet::get_comment_history( $c->comment_ID );
              $post    = get_post( $c->comment_post_ID );
              $session_id = get_comment_meta( $c->comment_ID, '_blackbox_session_id', true );

              $rows[] = array(
                  'id'        => 'comment-' . $c->comment_ID,
                  'timestamp' => mysql_to_rfc3339( $c->comment_date_gmt ),
                  'category'  => 'comments',
                  'source'    => 'akismet-content',
                  'outcome'   => 'block',
                  'subject'   => array(
                      'kind'      => 'comment',
                      'label'     => $c->comment_author,
                      'secondary' => $post ? get_the_title( $post ) : '',
                      'link'      => admin_url( 'comment.php?action=editcomment&c=' . $c->comment_ID ),
                  ),
                  'signals'   => array(
                      array(
                          'name'        => 'akismet_classification',
                          'weight'      => $score,
                          'description' => __( 'Akismet content rules.', 'akismet' ),
                      ),
                  ),
                  'ip'         => $c->comment_author_IP,
                  'visitor_id' => $session_id ?: null,
                  'context'    => array(
                      'comment_id' => (int) $c->comment_ID,
                      'history'    => is_array( $history ) ? array_slice( $history, 0, 5 ) : array(),
                  ),
                  'preview'    => false,
              );
          }
          return $rows;
      }

      protected static function query_checkouts( array $args ): array {
          if ( ! class_exists( 'WooCommerce' ) ) {
              return array();
          }
          $wfp_active = class_exists( 'WC_Fraud_Protection' ) || defined( 'WC_FRAUD_PROTECTION_PLUGIN_VERSION' );

          if ( ! $wfp_active ) {
              return self::query_mocked( 'checkouts', $args );
          }

          // TODO: real query against wc_get_orders with a meta_query on _woofraud_score.
          // Coordinate the exact meta key + threshold with @luizfreis. Returning a mock for now
          // so the UI is testable end-to-end. Mark rows preview=true since WFP-active isn't enough
          // without confirmed meta keys.
          return self::query_mocked( 'checkouts', $args );
      }

      protected static function query_mocked( string $category, array $args ): array {
          $seed  = crc32( $category );
          $count = array(
              'forms'       => 18,
              'logins'      => 24,
              'bots'        => 31,
              'brute-force' => 12,
              'checkouts'   => 9,
          )[ $category ] ?? 10;

          $outcomes = self::OUTCOMES;
          $sources_by_category = array(
              'forms'       => array( 'akismet-content', 'blackbox-behavioral' ),
              'logins'      => array( 'blackbox-behavioral', 'blackbox-fingerprint' ),
              'bots'        => array( 'blackbox-edge', 'blackbox-fingerprint' ),
              'brute-force' => array( 'blackbox-behavioral' ),
              'checkouts'   => array( 'woocommerce-fraud', 'blackbox-fingerprint' ),
          );

          $rows = array();
          for ( $i = 0; $i < $count; $i++ ) {
              $r = abs( ( $seed + $i * 31 ) % 9999 );
              $outcome = $outcomes[ $r % count( $outcomes ) ];
              $sources = $sources_by_category[ $category ];
              $source  = $sources[ $r % count( $sources ) ];

              $subject = self::mock_subject_for( $category, $i );

              $rows[] = array(
                  'id'        => $category . '-mock-' . $i,
                  'timestamp' => gmdate( 'c', time() - $r * 60 ),
                  'category'  => $category,
                  'source'    => $source,
                  'outcome'   => $outcome,
                  'subject'   => $subject,
                  'signals'   => array(
                      array(
                          'name'        => $category . '_' . str_replace( '-', '_', $source ) . '_rule',
                          'weight'      => round( ( $r % 100 ) / 100, 2 ),
                          'description' => sprintf( __( 'Preview signal for %s.', 'akismet' ), $category ),
                      ),
                  ),
                  'ip'         => sprintf( '%d.%d.%d.%d', ( $r % 200 ) + 10, $r % 256, ( $r * 7 ) % 256, ( $r * 13 ) % 256 ),
                  'visitor_id' => 'bbx_preview_' . substr( md5( $category . $i ), 0, 12 ),
                  'context'    => array(),
                  'preview'    => true,
              );
          }
          return $rows;
      }

      protected static function mock_subject_for( string $category, int $i ): array {
          switch ( $category ) {
              case 'forms':
                  return array(
                      'kind'      => 'form-submission',
                      'label'     => sprintf( __( 'Form submission #%d', 'akismet' ), $i + 1 ),
                      'secondary' => 'contact-form-7',
                  );
              case 'logins':
                  return array(
                      'kind'      => 'login-attempt',
                      'label'     => sprintf( 'admin (attempt #%d)', $i + 1 ),
                      'secondary' => 'wp-login.php',
                  );
              case 'bots':
                  return array(
                      'kind'      => 'visitor',
                      'label'     => sprintf( __( 'Crawler %d', 'akismet' ), $i + 1 ),
                      'secondary' => '/wp-json/wp/v2/posts',
                  );
              case 'brute-force':
                  return array(
                      'kind'      => 'login-attempt',
                      'label'     => sprintf( 'user-%d', $i + 1 ),
                      'secondary' => __( '142 attempts in 60s', 'akismet' ),
                  );
              case 'checkouts':
                  return array(
                      'kind'      => 'order',
                      'label'     => sprintf( __( 'Order #%d', 'akismet' ), 1000 + $i ),
                      'secondary' => sprintf( '$%d.00', 50 + $i * 11 ),
                  );
              default:
                  return array( 'kind' => 'visitor', 'label' => 'unknown' );
          }
      }
  }
  ```

- [ ] **Step 3: Register the REST route on `Akismet_Experimental`**

  Add to `class.akismet-experimental.php`'s `register_rest_routes()`:

  ```php
  register_rest_route( 'akismet/v1', '/activity', array(
      'methods'             => WP_REST_Server::READABLE,
      'callback'            => array( __CLASS__, 'rest_get_activity' ),
      'permission_callback' => array( __CLASS__, 'permission_manage_options' ),
      'args'                => array(
          'page'     => array( 'type' => 'integer', 'default' => 1, 'minimum' => 1 ),
          'per_page' => array( 'type' => 'integer', 'default' => 25, 'minimum' => 1, 'maximum' => 100 ),
          'category' => array(
              'type'    => 'string',
              'enum'    => array( 'all', 'comments', 'forms', 'logins', 'checkouts', 'bots', 'brute-force' ),
              'default' => 'all',
          ),
          'outcome'  => array(
              'type'    => 'string',
              'enum'    => array( 'all', 'block', 'challenge-passed', 'challenge-failed', 'allowed-but-flagged' ),
              'default' => 'all',
          ),
          'source'   => array(
              'type'    => 'string',
              'enum'    => array_merge( array( 'all' ), Akismet_Experimental_Activity::SOURCES ),
              'default' => 'all',
          ),
          'search'   => array( 'type' => 'string', 'default' => '' ),
          'from'     => array( 'type' => 'string' ),
          'to'       => array( 'type' => 'string' ),
      ),
  ) );
  ```

  And the callback:

  ```php
  public static function rest_get_activity( WP_REST_Request $request ) {
      require_once AKISMET__PLUGIN_DIR . 'class.akismet-experimental-activity.php';
      return rest_ensure_response( Akismet_Experimental_Activity::query( $request->get_params() ) );
  }
  ```

- [ ] **Step 4: Run PHPUnit, expect green**

  ```bash
  ./vendor/bin/phpunit wp-content/mu-plugins/akismet-3.0/tests/phpunit/test-rest-activity.php
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add wp-content/mu-plugins/akismet-3.0/class.akismet-experimental.php \
          wp-content/mu-plugins/akismet-3.0/class.akismet-experimental-activity.php \
          wp-content/mu-plugins/akismet-3.0/tests/phpunit/test-rest-activity.php
  git commit -m "akismet: akismet/v1/activity union endpoint"
  ```

### Task 3: Server — `GET /akismet/v1/blackbox/verdict/{session_id}`

**Files:**
- Modify: `class.akismet-experimental.php`

For row-drawer enrichment: when a row has a `visitor_id` (i.e. a `_blackbox_session_id` was captured at the originating event), the drawer fetches the full Blackbox verdict server-side. The Bearer key stays in PHP.

- [ ] **Step 1: Register**

  ```php
  register_rest_route( 'akismet/v1', '/blackbox/verdict/(?P<session_id>[A-Za-z0-9_-]+)', array(
      'methods'             => WP_REST_Server::READABLE,
      'callback'            => array( __CLASS__, 'rest_get_blackbox_verdict' ),
      'permission_callback' => array( __CLASS__, 'permission_manage_options' ),
  ) );
  ```

- [ ] **Step 2: Implement (mock-first)**

  ```php
  public static function rest_get_blackbox_verdict( WP_REST_Request $request ) {
      $session_id = $request->get_param( 'session_id' );

      // Real path (once @dtbecher confirms key + endpoint shape):
      //   $bearer = AKISMET_BLACKBOX_API_KEY;
      //   wp_remote_get(
      //     "https://blackbox-api.wp.com/v1/verify/{$session_id}",
      //     array( 'headers' => array( 'Authorization' => "Bearer {$bearer}" ) )
      //   );
      // Preview path: return a deterministic mock so the UI is testable.
      $seed = crc32( $session_id );
      $n    = fn( $o ) => abs( ( $seed + $o * 31 ) % 9999 );

      return rest_ensure_response( array(
          'session_id'  => $session_id,
          'decision'    => array( 'allow', 'challenge', 'block' )[ $n( 1 ) % 3 ],
          'risk_score'  => round( $n( 2 ) / 9999, 2 ),
          'confidence'  => 'medium',
          'visitor_id'  => $session_id,
          'ip_address'  => sprintf( '%d.%d.%d.%d', $n( 4 ) % 255, $n( 5 ) % 255, $n( 6 ) % 255, $n( 7 ) % 255 ),
          'signals'     => array(
              array(
                  'name'        => 'velocity_threshold',
                  'log_odds'    => 2.4,
                  'confidence'  => 0.86,
                  'category'    => 'velocity',
                  'rule_id'     => 'velocity_v3',
                  'rule_version'=> '3.1.0',
              ),
              array(
                  'name'        => 'webdriver_detected',
                  'log_odds'    => 4.1,
                  'confidence'  => 0.99,
                  'category'    => 'automation',
                  'rule_id'     => 'webdriver_v2',
                  'rule_version'=> '2.0.0',
              ),
          ),
          'preview'     => true,
      ) );
  }
  ```

- [ ] **Step 3: Commit**

### Task 4: Front-end types + MSW

**Files:**
- Create: `src/routes/activity/activity-types.ts`
- Modify: `tests/js/mocks/handlers.ts`

- [ ] **Step 1: Type**

  ```ts
  export type ActivityCategory = 'comments' | 'forms' | 'logins' | 'checkouts' | 'bots' | 'brute-force';
  export type ActivityOutcome  = 'block' | 'challenge-passed' | 'challenge-failed' | 'allowed-but-flagged';
  export type ActivitySource   =
    | 'akismet-content'
    | 'blackbox-behavioral'
    | 'blackbox-fingerprint'
    | 'blackbox-edge'
    | 'woocommerce-fraud'
    | 'akismet-rules';

  export type ActivityRow = {
    id: string;
    timestamp: string;
    category: ActivityCategory;
    source: ActivitySource;
    outcome: ActivityOutcome;
    subject: {
      kind: 'comment' | 'visitor' | 'order' | 'login-attempt' | 'form-submission';
      label: string;
      secondary?: string;
      link?: string;
    };
    signals: Array< {
      name: string;
      weight: number;
      description?: string;
    } >;
    ip?: string;
    visitor_id?: string;
    context: Record< string, unknown >;
    preview: boolean;
  };
  ```

- [ ] **Step 2: Handler**

  ```ts
  function makeMockRow( i: number, category: 'comments' | 'logins' | 'checkouts' ): ActivityRow {
    return {
      id: `${ category }-${ i }`,
      timestamp: '2026-05-20T12:00:00Z',
      category,
      source: category === 'comments' ? 'akismet-content' : 'blackbox-behavioral',
      outcome: 'block',
      subject: {
        kind: category === 'comments' ? 'comment' : category === 'logins' ? 'login-attempt' : 'order',
        label: category === 'comments' ? `Spammer ${ i }` : category === 'logins' ? `admin (attempt #${ i })` : `Order #${ 1000 + i }`,
      },
      signals: [
        { name: 'mock_signal', weight: 0.91 },
      ],
      visitor_id: category !== 'comments' ? `bbx_preview_${ i }` : undefined,
      context: {},
      preview: category !== 'comments',
    } as ActivityRow;
  }

  http.get( '*/akismet/v1/activity', ( { request } ) => {
    const url = new URL( request.url );
    const cat = url.searchParams.get( 'category' ) ?? 'all';
    const perPage = Number( url.searchParams.get( 'per_page' ) ?? '25' );
    const includes = ( c: 'comments' | 'logins' | 'checkouts' ) => cat === 'all' || cat === c;
    let items: ActivityRow[] = [];
    if ( includes( 'comments' ) ) for ( let i = 0; i < 20; i++ ) items.push( makeMockRow( i, 'comments' ) );
    if ( includes( 'logins' ) ) for ( let i = 0; i < 15; i++ ) items.push( makeMockRow( i, 'logins' ) );
    if ( includes( 'checkouts' ) ) for ( let i = 0; i < 8; i++ ) items.push( makeMockRow( i, 'checkouts' ) );
    const total = items.length;
    items = items.slice( 0, perPage );
    return HttpResponse.json( { items, total, page: 1, per_page: perPage, total_pages: Math.ceil( total / perPage ) } );
  } ),
  ```

- [ ] **Step 3: Commit**

### Task 5: `useActivity` hook (TDD)

**Files:**
- Create: `tests/js/hooks/use-activity.test.tsx`
- Create: `src/hooks/use-activity.ts`

- [ ] **Step 1: Failing test**

  ```tsx
  import { renderHook, waitFor } from '@testing-library/react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { useActivity } from '@/hooks/use-activity';

  function wrap() {
    const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
    return ( { children }: { children: React.ReactNode } ) => (
      <QueryClientProvider client={ client }>{ children }</QueryClientProvider>
    );
  }

  it( 'fetches the all-category page', async () => {
    const { result } = renderHook( () => useActivity( { page: 1, perPage: 25, category: 'all', outcome: 'all', source: 'all', search: '' } ), { wrapper: wrap() } );
    await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
    expect( result.current.data?.items.length ).toBeGreaterThan( 0 );
  } );

  it( 'filters by category', async () => {
    const { result } = renderHook( () => useActivity( { page: 1, perPage: 25, category: 'logins', outcome: 'all', source: 'all', search: '' } ), { wrapper: wrap() } );
    await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
    for ( const row of result.current.data?.items ?? [] ) {
      expect( row.category ).toBe( 'logins' );
    }
  } );
  ```

- [ ] **Step 2: Implement**

  ```ts
  import { useQuery, keepPreviousData } from '@tanstack/react-query';
  import { apiClient } from '@/lib/api-client';
  import type { ActivityRow, ActivityCategory, ActivityOutcome, ActivitySource } from '@/routes/activity/activity-types';

  export type ActivityQueryParams = {
    page: number;
    perPage: number;
    category: ActivityCategory | 'all';
    outcome: ActivityOutcome | 'all';
    source: ActivitySource | 'all';
    search: string;
    from?: string;
    to?: string;
  };

  export type ActivityResponse = {
    items: ActivityRow[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };

  export function useActivity( params: ActivityQueryParams ) {
    const search = new URLSearchParams( {
      page: String( params.page ),
      per_page: String( params.perPage ),
      category: params.category,
      outcome: params.outcome,
      source: params.source,
    } );
    if ( params.search ) search.set( 'search', params.search );
    if ( params.from ) search.set( 'from', params.from );
    if ( params.to ) search.set( 'to', params.to );

    return useQuery( {
      queryKey: [ 'akismet', 'activity', params ],
      queryFn: () => apiClient.get< ActivityResponse >( `activity?${ search.toString() }` ),
      placeholderData: keepPreviousData,
    } );
  }
  ```

- [ ] **Step 3: Commit**

### Task 6: DataViews field + filter definitions

**Files:**
- Create: `src/routes/activity/fields.tsx`
- Create: `src/routes/activity/filters.ts`

Reference: `projects/packages/activity-log/src/js/components/ActivityLog/index.tsx` in jetpack-monorepo for the field + filter API at this version.

- [ ] **Step 1: Fields**

  ```tsx
  import { __, sprintf } from '@wordpress/i18n';
  import type { Field } from '@wordpress/dataviews';
  import type { ActivityRow } from './activity-types';

  function formatDate( gmt: string ): string {
    return new Intl.DateTimeFormat( undefined, { dateStyle: 'medium', timeStyle: 'short' } ).format( new Date( gmt ) );
  }

  function categoryLabel( c: ActivityRow[ 'category' ] ): string {
    return {
      comments: __( 'Comments', 'akismet' ),
      forms: __( 'Forms', 'akismet' ),
      logins: __( 'Logins', 'akismet' ),
      checkouts: __( 'Checkouts', 'akismet' ),
      bots: __( 'Bots', 'akismet' ),
      'brute-force': __( 'Brute-force', 'akismet' ),
    }[ c ];
  }

  function outcomeBadge( o: ActivityRow[ 'outcome' ] ): { label: string; tone: 'destructive' | 'warning' | 'success' | 'info' } {
    return {
      block: { label: __( 'Blocked', 'akismet' ), tone: 'destructive' },
      'challenge-passed': { label: __( 'Challenge passed', 'akismet' ), tone: 'success' },
      'challenge-failed': { label: __( 'Challenge failed', 'akismet' ), tone: 'destructive' },
      'allowed-but-flagged': { label: __( 'Allowed (flagged)', 'akismet' ), tone: 'warning' },
    }[ o ];
  }

  export const fields: Field< ActivityRow >[] = [
    {
      id: 'subject',
      label: __( 'What was it', 'akismet' ),
      enableSorting: false,
      render( { item } ) {
        return (
          <span>
            <strong>{ item.subject.label }</strong>
            { item.subject.secondary && (
              <>
                <br />
                <small>{ item.subject.secondary }</small>
              </>
            ) }
            { item.preview && (
              <>
                <br />
                <span className="akismet-activity__badge">{ __( 'preview data', 'akismet' ) }</span>
              </>
            ) }
          </span>
        );
      },
    },
    {
      id: 'category',
      label: __( 'Category', 'akismet' ),
      enableSorting: false,
      render( { item } ) {
        return <span>{ categoryLabel( item.category ) }</span>;
      },
    },
    {
      id: 'outcome',
      label: __( 'Outcome', 'akismet' ),
      enableSorting: false,
      render( { item } ) {
        const b = outcomeBadge( item.outcome );
        return <span className={ `akismet-activity__outcome akismet-activity__outcome--${ b.tone }` }>{ b.label }</span>;
      },
    },
    {
      id: 'source',
      label: __( 'Source', 'akismet' ),
      enableSorting: false,
      render( { item } ) {
        return <code>{ item.source }</code>;
      },
    },
    {
      id: 'timestamp',
      label: __( 'When', 'akismet' ),
      enableSorting: true,
      render( { item } ) {
        return <span>{ formatDate( item.timestamp ) }</span>;
      },
    },
  ];
  ```

- [ ] **Step 2: Filters**

  ```ts
  import { __ } from '@wordpress/i18n';
  import type { ActivityRow } from './activity-types';

  export const filterConfig = [
    {
      id: 'category',
      label: __( 'Category', 'akismet' ),
      elements: [
        { value: 'all', label: __( 'All categories', 'akismet' ) },
        { value: 'comments', label: __( 'Comments', 'akismet' ) },
        { value: 'forms', label: __( 'Forms', 'akismet' ) },
        { value: 'logins', label: __( 'Logins', 'akismet' ) },
        { value: 'checkouts', label: __( 'Checkouts', 'akismet' ) },
        { value: 'bots', label: __( 'Bots', 'akismet' ) },
        { value: 'brute-force', label: __( 'Brute-force', 'akismet' ) },
      ],
    },
    {
      id: 'outcome',
      label: __( 'Outcome', 'akismet' ),
      elements: [
        { value: 'all', label: __( 'All outcomes', 'akismet' ) },
        { value: 'block', label: __( 'Blocked', 'akismet' ) },
        { value: 'challenge-passed', label: __( 'Challenge passed', 'akismet' ) },
        { value: 'challenge-failed', label: __( 'Challenge failed', 'akismet' ) },
        { value: 'allowed-but-flagged', label: __( 'Allowed (flagged)', 'akismet' ) },
      ],
    },
    {
      id: 'source',
      label: __( 'Source', 'akismet' ),
      elements: [
        { value: 'all', label: __( 'All sources', 'akismet' ) },
        { value: 'akismet-content', label: 'akismet-content' },
        { value: 'blackbox-behavioral', label: 'blackbox-behavioral' },
        { value: 'blackbox-fingerprint', label: 'blackbox-fingerprint' },
        { value: 'blackbox-edge', label: 'blackbox-edge' },
        { value: 'woocommerce-fraud', label: 'woocommerce-fraud' },
        { value: 'akismet-rules', label: 'akismet-rules' },
      ],
    },
  ] as const;
  ```

- [ ] **Step 3: Commit**

### Task 7: Row actions — gated by `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS`

**Files:**
- Create: `src/routes/activity/actions.tsx`
- Create: `src/routes/activity/use-toast.ts` (lightweight notice helper)

Comment rows still need "Not spam" + "Delete permanently." Non-comment rows don't have those actions today. **Critical guardrail:** these actions only actually mutate when `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS` is true (per [GUARDRAILS.md](../GUARDRAILS.md)). When it's false (the default), the buttons render but the click renders a "Preview mode — action disabled" notice and returns without firing `apiFetch`.

This is intentional: reviewers see the UX, demonstrate the flow during cross-team crits, and never accidentally mutate the sandbox's comment table. To exercise real mutations, the user defines the constant.

> **Threat model:** the mutation gate is a **UX guardrail**, not a security boundary. A determined user with `moderate_comments` could open the browser console and call `apiFetch('/wp/v2/comments/<id>', { method: 'POST', data: { status: 'approve' } })` directly — and core's own permission callback would allow it. That's the same as opening the legacy `edit-comments.php` and clicking Approve. The gate exists to prevent **accidental clicks during preview demos**, not to defend against an adversarial logged-in admin. If someone wants to bypass it, the legacy moderation UI is one URL away anyway.

- [ ] **Step 1: Tiny notice helper**

  Create `src/routes/activity/use-toast.ts`:

  ```ts
  import { dispatch } from '@wordpress/data';
  import { store as noticesStore } from '@wordpress/notices';

  export function showPreviewModeNotice( actionLabel: string ): void {
    void dispatch( noticesStore ).createNotice(
      'info',
      `Preview mode — “${ actionLabel }” is disabled. Define AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS in wp-config to enable.`,
      { type: 'snackbar', isDismissible: true }
    );
  }
  ```

- [ ] **Step 2: Implement the actions with the mutation gate**

  ```tsx
  import { useMutation } from '@tanstack/react-query';
  import { __ } from '@wordpress/i18n';
  import apiFetch from '@wordpress/api-fetch';
  import type { Action } from '@wordpress/dataviews';
  import { allowMutations } from '@/lib/is-jetpack-active';
  import { showPreviewModeNotice } from './use-toast';
  import type { ActivityRow } from './activity-types';

  type Invalidate = () => void;

  function isComment( row: ActivityRow ): boolean {
    return row.subject.kind === 'comment';
  }

  export function useActions( invalidate: Invalidate ): Action< ActivityRow >[] {
    const markAsHam = useMutation( {
      mutationFn: ( commentIds: number[] ) =>
        Promise.all( commentIds.map( ( id ) =>
          apiFetch( { path: `/wp/v2/comments/${ id }`, method: 'POST', data: { status: 'approve' } } )
        ) ),
      onSuccess: invalidate,
    } );
    const deletePermanently = useMutation( {
      mutationFn: ( commentIds: number[] ) =>
        Promise.all( commentIds.map( ( id ) =>
          apiFetch( { path: `/wp/v2/comments/${ id }?force=true`, method: 'DELETE' } )
        ) ),
      onSuccess: invalidate,
    } );

    function commentIds( rows: ActivityRow[] ): number[] {
      return rows
        .filter( isComment )
        .map( ( r ) => ( r.context.comment_id as number ) )
        .filter( ( id ) => Number.isInteger( id ) );
    }

    return [
      {
        id: 'mark-as-ham',
        label: __( 'Not spam', 'akismet' ),
        supportsBulk: true,
        isEligible: isComment,
        callback: ( items ) => {
          if ( ! allowMutations() ) {
            showPreviewModeNotice( 'Not spam' );
            return;
          }
          markAsHam.mutate( commentIds( items ) );
        },
      },
      {
        id: 'delete-permanently',
        label: __( 'Delete permanently', 'akismet' ),
        supportsBulk: true,
        isDestructive: true,
        isEligible: isComment,
        callback: ( items ) => {
          if ( ! allowMutations() ) {
            showPreviewModeNotice( 'Delete permanently' );
            return;
          }
          deletePermanently.mutate( commentIds( items ) );
        },
      },
    ];
  }
  ```

- [ ] **Step 3: Tripwire tests**

  Add `tests/js/routes/activity/actions.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { useActions } from '@/routes/activity/actions';
  import { server } from '../../mocks/server';
  import { http, HttpResponse } from 'msw';

  function Harness( { invalidate }: { invalidate: () => void } ) {
    const actions = useActions( invalidate );
    const a = actions.find( ( x ) => x.id === 'mark-as-ham' );
    return (
      <button onClick={ () => a?.callback?.( [ { id: 'comment-1', subject: { kind: 'comment' }, context: { comment_id: 1 } } as never ] ) }>
        Not spam
      </button>
    );
  }

  function renderWithClient( ui: React.ReactNode ) {
    const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
    return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
  }

  describe( 'useActions — guardrails', () => {
    afterEach( () => {
      // @ts-expect-error
      delete window.akismetExperimental;
    } );

    it( 'does NOT call apiFetch when allowMutations is false', async () => {
      const fetched: string[] = [];
      server.use(
        http.post( '*/wp/v2/comments/:id', async ( { request } ) => {
          fetched.push( new URL( request.url ).pathname );
          return HttpResponse.json( { id: 1 } );
        } )
      );

      ( window as unknown as { akismetExperimental: { allowMutations: boolean } } ).akismetExperimental = {
        allowMutations: false,
      };

      const invalidate = jest.fn();
      renderWithClient( <Harness invalidate={ invalidate } /> );
      await userEvent.click( screen.getByRole( 'button', { name: /not spam/i } ) );

      expect( fetched ).toHaveLength( 0 );
      expect( invalidate ).not.toHaveBeenCalled();
    } );

    it( 'DOES call apiFetch when allowMutations is true', async () => {
      const fetched: string[] = [];
      server.use(
        http.post( '*/wp/v2/comments/:id', async ( { request } ) => {
          fetched.push( new URL( request.url ).pathname );
          return HttpResponse.json( { id: 1, status: 'approved' } );
        } )
      );

      ( window as unknown as { akismetExperimental: { allowMutations: boolean } } ).akismetExperimental = {
        allowMutations: true,
      };

      const invalidate = jest.fn();
      renderWithClient( <Harness invalidate={ invalidate } /> );
      await userEvent.click( screen.getByRole( 'button', { name: /not spam/i } ) );

      await screen.findByRole( 'button', { name: /not spam/i } ); // wait for mutation flush
      expect( fetched.at( -1 ) ).toMatch( /\/wp\/v2\/comments\/1$/ );
      expect( invalidate ).toHaveBeenCalledTimes( 1 );
    } );
  } );
  ```

- [ ] **Step 4: Commit**

  ```bash
  npm test -- --testPathPattern=activity/actions
  git add src/routes/activity/actions.tsx src/routes/activity/use-toast.ts tests/js/routes/activity/actions.test.tsx
  git commit -m "akismet: gate mutation actions behind AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS"
  ```

### Task 8: Row drawer + Blackbox report panel

**Files:**
- Create: `src/routes/activity/row-drawer.tsx`
- Create: `src/routes/activity/blackbox-report-panel.tsx`
- Create: `src/hooks/use-blackbox-row-verdict.ts`

The drawer is one Modal. It always shows:
- The subject (label, secondary, link)
- The signals that fired
- IP + visitor_id

It conditionally shows a **`<BlackboxReportPanel>`** when the row has a `visitor_id` — fetches the per-session verdict from `/akismet/v1/blackbox/verdict/{session_id}`.

- [ ] **Step 1: Hook**

  Create `src/hooks/use-blackbox-row-verdict.ts`:

  ```ts
  import { useQuery } from '@tanstack/react-query';
  import { apiClient } from '@/lib/api-client';

  export type BlackboxVerdict = {
    session_id: string;
    decision: 'allow' | 'challenge' | 'block';
    risk_score: number;
    confidence: string;
    visitor_id: string;
    ip_address: string;
    signals: Array< {
      name: string;
      log_odds: number;
      confidence: number;
      category: string;
      rule_id: string;
      rule_version: string;
    } >;
    preview: boolean;
  };

  export function useBlackboxRowVerdict( sessionId: string | undefined | null ) {
    return useQuery( {
      queryKey: [ 'akismet', 'blackbox', 'verdict', sessionId ],
      queryFn: () => apiClient.get< BlackboxVerdict >( `blackbox/verdict/${ sessionId }` ),
      enabled: !! sessionId,
    } );
  }
  ```

- [ ] **Step 2: Panel**

  Create `src/routes/activity/blackbox-report-panel.tsx`:

  ```tsx
  import { Spinner } from '@wordpress/components';
  import { __, sprintf } from '@wordpress/i18n';
  import { useBlackboxRowVerdict } from '@/hooks/use-blackbox-row-verdict';

  type Props = { visitorId: string };

  export function BlackboxReportPanel( { visitorId }: Props ): JSX.Element {
    const { data, isLoading } = useBlackboxRowVerdict( visitorId );

    if ( isLoading || ! data ) {
      return <Spinner />;
    }

    return (
      <section className="akismet-activity-drawer__blackbox">
        <h4>{ __( 'Blackbox verdict', 'akismet' ) }
          { data.preview && (
            <span className="akismet-activity__badge">{ __( 'preview data', 'akismet' ) }</span>
          ) }
        </h4>
        <dl>
          <dt>{ __( 'Decision', 'akismet' ) }</dt>
          <dd><code>{ data.decision }</code></dd>
          <dt>{ __( 'Risk score', 'akismet' ) }</dt>
          <dd>{ Math.round( data.risk_score * 100 ) }%</dd>
          <dt>{ __( 'Confidence', 'akismet' ) }</dt>
          <dd>{ data.confidence }</dd>
          <dt>{ __( 'Visitor identity', 'akismet' ) }</dt>
          <dd><code>{ data.visitor_id }</code></dd>
        </dl>
        <h5>{ __( 'Signals that fired', 'akismet' ) }</h5>
        <ul>
          { data.signals.map( ( s ) => (
            <li key={ s.rule_id }>
              <code>{ s.name }</code>
              { ' — ' }
              { sprintf( __( '+%s log-odds, %d%% confidence (%s)', 'akismet' ), s.log_odds, Math.round( s.confidence * 100 ), s.category ) }
            </li>
          ) ) }
        </ul>
      </section>
    );
  }
  ```

- [ ] **Step 3: Drawer**

  Create `src/routes/activity/row-drawer.tsx`:

  ```tsx
  import { Modal, ExternalLink } from '@wordpress/components';
  import { __ } from '@wordpress/i18n';
  import { BlackboxReportPanel } from './blackbox-report-panel';
  import type { ActivityRow } from './activity-types';

  type Props = {
    row: ActivityRow;
    onClose: () => void;
  };

  export function RowDrawer( { row, onClose }: Props ): JSX.Element {
    return (
      <Modal title={ row.subject.label } onRequestClose={ onClose }>
        <section className="akismet-activity-drawer__subject">
          { row.subject.secondary && <p>{ row.subject.secondary }</p> }
          { row.subject.link && <ExternalLink href={ row.subject.link }>{ __( 'Open in WordPress', 'akismet' ) }</ExternalLink> }
        </section>

        <section className="akismet-activity-drawer__signals">
          <h4>{ __( 'Why we flagged this', 'akismet' ) }</h4>
          <ul>
            { row.signals.map( ( s ) => (
              <li key={ s.name }>
                <code>{ s.name }</code>
                { s.description && <> — { s.description }</> }
                <span> ({ __( 'weight:', 'akismet' ) } { s.weight })</span>
              </li>
            ) ) }
          </ul>
        </section>

        <section className="akismet-activity-drawer__meta">
          { row.ip && <p><strong>{ __( 'IP:', 'akismet' ) }</strong> <code>{ row.ip }</code></p> }
          { row.visitor_id && <p><strong>{ __( 'Visitor:', 'akismet' ) }</strong> <code>{ row.visitor_id }</code></p> }
        </section>

        { row.visitor_id && <BlackboxReportPanel visitorId={ row.visitor_id } /> }
      </Modal>
    );
  }
  ```

- [ ] **Step 4: Commit**

### Task 9: View state + `<ActivityTab>`

**Files:**
- Create: `src/routes/activity/views.ts`
- Create: `src/routes/activity-tab.tsx`
- Create: `src/styles/activity.scss`

- [ ] **Step 1: Views**

  Same structure as the prior plan's Spam log views, with `STORAGE_KEY = 'akismet:activity:view'` and default fields = the five field IDs from Task 6.

  Reference: `projects/packages/activity-log/src/js/components/ActivityLog/index.tsx` for the View shape at the pinned DataViews version.

- [ ] **Step 2: `<ActivityTab>`**

  ```tsx
  import { useState, useMemo } from '@wordpress/element';
  import { DataViews } from '@wordpress/dataviews';
  import { useQueryClient } from '@tanstack/react-query';
  import { fields } from './activity/fields';
  import { filterConfig } from './activity/filters';
  import { defaultView, loadView, saveView } from './activity/views';
  import { useActions } from './activity/actions';
  import { useActivity, type ActivityQueryParams } from '@/hooks/use-activity';
  import { RowDrawer } from './activity/row-drawer';
  import type { ActivityRow, ActivityCategory } from './activity/activity-types';

  type Props = {
    initialCategoryFilter?: ActivityCategory;
  };

  export function ActivityTab( { initialCategoryFilter }: Props ): JSX.Element {
    const [ view, setView ] = useState( () => {
      const v = loadView();
      if ( initialCategoryFilter ) {
        const existing = v.filters?.filter( ( f ) => f.field !== 'category' ) ?? [];
        return {
          ...v,
          filters: [ ...existing, { field: 'category', operator: 'is', value: initialCategoryFilter } ],
        };
      }
      return v;
    } );
    const [ drawerRow, setDrawerRow ] = useState< ActivityRow | null >( null );
    const queryClient = useQueryClient();

    const params = useMemo< ActivityQueryParams >( () => {
      const filterValue = ( id: string ) =>
        ( view.filters?.find( ( f ) => f.field === id )?.value as string ) ?? 'all';

      return {
        page: view.page ?? 1,
        perPage: view.perPage ?? 25,
        category: filterValue( 'category' ) as ActivityCategory | 'all',
        outcome: filterValue( 'outcome' ) as ActivityQueryParams[ 'outcome' ],
        source: filterValue( 'source' ) as ActivityQueryParams[ 'source' ],
        search: view.search ?? '',
      };
    }, [ view ] );

    const { data, isLoading } = useActivity( params );
    const actions = useActions( () => queryClient.invalidateQueries( { queryKey: [ 'akismet', 'activity' ] } ) );

    const allActions = useMemo< typeof actions >( () => [
      {
        id: 'preview',
        label: 'View details',
        callback: ( items ) => setDrawerRow( items[ 0 ] ?? null ),
      },
      ...actions,
    ], [ actions ] );

    return (
      <div className="akismet-activity">
        <DataViews
          data={ data?.items ?? [] }
          fields={ fields }
          view={ view }
          onChangeView={ ( next ) => { setView( next ); saveView( next ); } }
          actions={ allActions }
          filters={ filterConfig as unknown as never }
          paginationInfo={ {
            totalItems: data?.total ?? 0,
            totalPages: data?.total_pages ?? 0,
          } }
          isLoading={ isLoading }
          defaultLayouts={ { table: {} } }
          getItemId={ ( item ) => item.id }
        />
        { drawerRow && <RowDrawer row={ drawerRow } onClose={ () => setDrawerRow( null ) } /> }
      </div>
    );
  }
  ```

  > **Note on filter API:** the exact `filters` prop shape depends on the `@wordpress/dataviews` version pinned in Plan 0. The activity-log reference in jetpack-monorepo at the same version is authoritative; the casts above are placeholders. Match the live API at execution time.

- [ ] **Step 3: Styles**

  Add to `src/styles/activity.scss`:

  ```scss
  .akismet-activity {
      &__badge {
          background: var( --wp-components-color-accent-04, #fff9c4 );
          color: var( --wp-components-color-foreground, #1e1e1e );
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
      }

      &__outcome {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;

          &--destructive { background: rgba( 215, 38, 56, 0.12 ); color: #a8001f; }
          &--warning     { background: rgba( 240, 167, 0, 0.18 ); color: #7a5300; }
          &--success     { background: rgba( 0, 132, 96, 0.14 ); color: #00604a; }
          &--info        { background: rgba( 49, 132, 250, 0.12 ); color: #1a4e8a; }
      }
  }

  .akismet-activity-drawer__signals ul,
  .akismet-activity-drawer__blackbox ul {
      list-style: none;
      padding: 0;

      li { padding: 4px 0; }
  }
  ```

- [ ] **Step 4: Tests** — render the tab, assert at least one comment row + one preview row are present.

- [ ] **Step 5: Commit**

### Task 10: Mount the Activity tab in `<App>`

**Files:**
- Modify: `src/app.tsx`

- [ ] **Step 1: Add the tab** (Plan 2 also touches this; merge order matters)

  ```tsx
  <Tabs.Tab value="activity">{ __( 'Activity', 'akismet' ) }</Tabs.Tab>
  ...
  <Tabs.TabPanel value="activity">
    <ActivityTab initialCategoryFilter={ getCategoryFromUrl() } />
  </Tabs.TabPanel>
  ```

  Read the initial category filter from URL `?category=`:

  ```ts
  function getCategoryFromUrl(): ActivityCategory | undefined {
    const v = new URL( window.location.href ).searchParams.get( 'category' );
    const allowed = [ 'comments', 'forms', 'logins', 'checkouts', 'bots', 'brute-force' ];
    return allowed.includes( v ?? '' ) ? ( v as ActivityCategory ) : undefined;
  }
  ```

  This wires up Plan 2's "See activity →" deep-link from each category card.

- [ ] **Step 2: Commit**

### Task 11: Manual verification

- [ ] **Step 1: With ≥ 50 spam comments, open the Activity tab**

  - Rows render. Comments rows have no preview badge; Logins / Bots / Brute-force / Forms rows do.
  - Filter by category=logins → only logins rows show.
  - Filter by outcome=challenge-passed → only those rows show.
  - Search "needle" matches the spam comment whose content contains it.

- [ ] **Step 2: Bulk-select two comment rows + "Not spam"**

  Those comments are approved; they disappear from the spam list at the next refresh.

- [ ] **Step 3: Click a comment row → drawer**

  - Subject, signals, IP shown.
  - Blackbox panel absent (no `visitor_id` until comment-time capture is wired).

- [ ] **Step 4: Click a logins / bots / brute-force row → drawer**

  - Blackbox panel renders with mocked verdict + signals + "preview data" badge.

- [ ] **Step 5: Reload — sort / filter / density persist** via localStorage.

- [ ] **Step 6: Deep-link from Overview**

  Click "See activity →" on the Comments card in Overview → Activity tab opens with category=comments preselected.

- [ ] **Step 7: Screenshot for PR**

  Capture: all-categories view, single-category-filter view, comment row drawer, login row drawer (with Blackbox panel).

### Task 12: PR

- [ ] **Step 1: Push + open**

  ```bash
  git push -u origin akismet/experimental-ui-activity-log
  gh pr create --title "akismet: experimental UI — unified Activity log" --body "..."
  ```

  Body template:

  ```
  ## Summary

  - New "Activity" tab with `@wordpress/dataviews` covering every category in one table.
  - Comment-spam rows are real (`WP_Comment_Query`); other categories ship deterministic mocks with `preview: true` flags.
  - New REST endpoints `/akismet/v1/activity` (union query) and `/akismet/v1/blackbox/verdict/{session_id}` (server-side proxy).
  - Row drawer shows per-row reasoning. Blackbox verdict panel renders when a `visitor_id` is present.
  - Comment-specific row actions ("Not spam", "Delete permanently") hit `/wp/v2/comments`.
  - Filters: category, outcome, source, search, date range.

  ## Test plan

  - [ ] PHPUnit: `tests/phpunit/test-rest-activity.php`
  - [ ] JS: `npm test`
  - [ ] Filter by every category individually
  - [ ] Open drawer for comment row + login row + bot row
  - [ ] Bulk-mark comments as ham; confirm they leave the spam list
  - [ ] Deep-link from Overview category card → Activity tab pre-filtered
  ```

  Suggested reviewers: `cfinke`, `bluefuton`, `@dtbecher`, `keoshi`.

---

## Self-review checklist

- Does every row use the same `ActivityRow` shape? (Should — schema is enforced by the union query.)
- Are mocked rows visibly badged?
- Is the "Not spam" action correctly hidden on non-comment rows? (Eligibility via `isComment`.)
- Does the row drawer reveal Blackbox verdict only when `visitor_id` exists?
- Is `useActivity` cached so flipping filters doesn't re-fetch unnecessarily? (`keepPreviousData` should keep the prior page visible while loading.)
- Does the PHP union query degrade gracefully when WC isn't installed? (Yes — `query_checkouts` returns `[]` when `class_exists('WooCommerce')` is false.)
- Does the deep-link from Overview pre-populate the category filter?
- Is the search performant on a site with thousands of spam comments? (The mock paginates after union; real prod would need per-source SQL filtering — flagged as a production-track concern, not this prototype's.)
