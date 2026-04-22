# Jetpack Search AI Answers — WordPress Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the WP plugin side of Jetpack Search AI Answers: two CPTs, sync, an HMAC auth token, a tabbed admin UI, and an AI answers panel in the instant-search overlay.

**Architecture:** Two private CPTs (`jp_search_behavior`, `jetpack_search_topic`) synced to wpcom via the Search sync module. An HMAC token embedded in `JetpackInstantSearchOptions` authenticates anonymous overlay visitors to the wpcom AI agent endpoint. The Search dashboard gains Stats-style top-level tabs (Overview / Behavior / Topics). The instant-search overlay gains an `AnswersPanel` component that streams tokens from the wpcom agent endpoint via `fetchEventSource`.

**Tech Stack:** PHP 7.4+, PHPUnit, WordPress REST API (`wp_apiFetch`), React 18, `@wordpress/data`, `@microsoft/fetch-event-source` (new dep), Jest.

**Scope note:** This plan covers the WP plugin side only. The wpcom AI agent (`Jetpack_Search_Answers_Agent`, topic-lookup ability, quota tracking) is a separate implementation documented in `2026-04-21-search-ai-answers-api-design.md`. The overlay panel will render correctly but the AI call will return 404 until the wpcom agent is live.

---

## File Map

### New files

| File | Purpose |
|------|---------|
| `src/class-ai-answers.php` | CPT registration, postmeta registration, `jetpack_search_ai_answers_enabled` filter hook |
| `src/dashboard/components/tabs/index.jsx` | Stats-style tab bar component |
| `src/dashboard/components/tabs/index.scss` | Tab bar styles |
| `src/dashboard/components/behavior-tab/index.jsx` | Behavior tab — reads/writes `jp_search_behavior` post via REST |
| `src/dashboard/components/topics-tab/index.jsx` | Topics tab — lists `jetpack_search_topic` posts, links to WP post editor |
| `src/instant-search/components/answers-panel.jsx` | Overlay AI answers panel (idle / loading / streaming / done / error states) |
| `src/instant-search/components/answers-panel.scss` | Panel styles |
| `tests/php/AI_Answers_Test.php` | PHPUnit tests for CPT registration and HMAC token |

### Modified files

| File | Change |
|------|--------|
| `src/initializers/class-initializer.php` | Initialize `AI_Answers` in `init_before_connection()` |
| `src/class-helper.php` | Add `aiAnswersToken` and `siteId` to `generate_initial_javascript_state()` |
| `src/dashboard/components/pages/dashboard-page.jsx` | Wrap content in tab bar; move existing content to Overview tab |
| `src/instant-search/components/search-app.jsx` | Add `AnswersPanel` above `SearchResults`; wire SSE on query change |
| `package.json` | Add `@microsoft/fetch-event-source` dependency |
| `projects/packages/sync/src/modules/class-search.php` | Add CPT and postmeta sync hooks |
| `projects/packages/sync/tests/php/modules/Module_Test.php` | Sync module unit tests |

---

## Task 1: Register CPTs

**Files:**
- Create: `src/class-ai-answers.php`
- Modify: `src/initializers/class-initializer.php`
- Test: `tests/php/AI_Answers_Test.php`

- [ ] **Step 1: Write failing test**

```php
<?php
// tests/php/AI_Answers_Test.php
namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

class AI_Answers_Test extends Search_TestCase {
    public static function setUpBeforeClass(): void {
        parent::setUpBeforeClass();
        ( new AI_Answers() )->init();
        do_action( 'init' );
    }

    public function test_behavior_cpt_registered() {
        $this->assertTrue( post_type_exists( 'jp_search_behavior' ) );
    }

    public function test_topic_cpt_registered() {
        $this->assertTrue( post_type_exists( 'jetpack_search_topic' ) );
    }

    public function test_cpts_are_private() {
        $behavior = get_post_type_object( 'jp_search_behavior' );
        $topic    = get_post_type_object( 'jetpack_search_topic' );
        $this->assertFalse( $behavior->public );
        $this->assertFalse( $topic->public );
    }

    public function test_cpts_show_in_rest() {
        $behavior = get_post_type_object( 'jp_search_behavior' );
        $topic    = get_post_type_object( 'jetpack_search_topic' );
        $this->assertTrue( $behavior->show_in_rest );
        $this->assertTrue( $topic->show_in_rest );
    }

    public function test_topic_postmeta_registered() {
        $registered = get_registered_meta_keys( 'post', 'jetpack_search_topic' );
        $this->assertArrayHasKey( '_jstopic_keywords', $registered );
        $this->assertArrayHasKey( '_jstopic_url', $registered );
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
jetpack test php packages/search -v --filter=AI_Answers_Test
```

Expected: FAIL — class `AI_Answers` not found.

- [ ] **Step 3: Create `src/class-ai-answers.php`**

```php
<?php
/**
 * AI Answers feature — CPT registration and token helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Registers the jp_search_behavior and jetpack_search_topic CPTs
 * and exposes the jetpack_search_ai_answers_enabled filter.
 */
class AI_Answers {
    const BEHAVIOR_CPT = 'jp_search_behavior';
    const TOPIC_CPT    = 'jetpack_search_topic';

    /**
     * Hook up CPT registration.
     */
    public function init() {
        add_action( 'init', array( $this, 'register_post_types' ) );
        add_filter( 'jetpack_search_ai_answers_enabled', array( $this, 'is_feature_enabled' ) );
    }

    /**
     * Register both CPTs and their postmeta.
     */
    public function register_post_types() {
        register_post_type(
            self::BEHAVIOR_CPT,
            array(
                'labels'          => array(
                    'name'          => 'Search Behavior',
                    'singular_name' => 'Search Behavior',
                ),
                'public'          => false,
                'show_ui'         => true,
                'show_in_menu'    => false,
                'show_in_rest'    => true,
                'rest_base'       => 'jetpack-search-behavior',
                'supports'        => array( 'editor' ),
                'capability_type' => 'post',
                'map_meta_cap'    => true,
            )
        );

        register_post_type(
            self::TOPIC_CPT,
            array(
                'labels'          => array(
                    'name'          => 'Search Topics',
                    'singular_name' => 'Search Topic',
                ),
                'public'          => false,
                'show_ui'         => true,
                'show_in_menu'    => false,
                'show_in_rest'    => true,
                'rest_base'       => 'jetpack-search-topics',
                'supports'        => array( 'title', 'editor' ),
                'capability_type' => 'post',
                'map_meta_cap'    => true,
            )
        );

        register_post_meta(
            self::TOPIC_CPT,
            '_jstopic_keywords',
            array(
                'single'        => true,
                'type'          => 'string',
                'show_in_rest'  => true,
                'auth_callback' => function () {
                    return current_user_can( 'edit_posts' );
                },
            )
        );

        register_post_meta(
            self::TOPIC_CPT,
            '_jstopic_url',
            array(
                'single'        => true,
                'type'          => 'string',
                'show_in_rest'  => true,
                'auth_callback' => function () {
                    return current_user_can( 'edit_posts' );
                },
            )
        );
    }

    /**
     * Return true if AI Answers feature is enabled.
     * Reads the jetpack_search_ai_answers_enabled option; defaults to false.
     *
     * @param bool $enabled Current enabled state.
     * @return bool
     */
    public function is_feature_enabled( $enabled ) {
        return $enabled || (bool) get_option( 'jetpack_search_ai_answers_enabled', false );
    }

    /**
     * Whether AI Answers is enabled for the current site.
     */
    public static function is_enabled() {
        return (bool) apply_filters( 'jetpack_search_ai_answers_enabled', false );
    }
}
```

- [ ] **Step 4: Wire into `Initializer::init_before_connection()`**

In `src/initializers/class-initializer.php`, find the `init_before_connection()` method and add:

```php
protected static function init_before_connection() {
    // Set up Search API endpoints.
    add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
    // The dashboard has to be initialized before connection.
    ( new Dashboard() )->init_hooks();
    // Register AI Answers CPTs (always, so REST API works in block editor).
    ( new AI_Answers() )->init();
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
jetpack test php packages/search -v --filter=AI_Answers_Test
```

Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/class-ai-answers.php src/initializers/class-initializer.php tests/php/AI_Answers_Test.php
git commit -m "Search: register jp_search_behavior and jetpack_search_topic CPTs"
```

---

## Task 2: Add CPTs to Sync Whitelist

**Files:**
- Modify: `projects/packages/sync/src/modules/class-search.php`
- Test: `projects/packages/sync/tests/php/modules/Module_Test.php`

- [ ] **Step 1: Read the existing Module_Test.php to understand test style**

```bash
head -60 projects/packages/sync/tests/php/modules/Module_Test.php
```

- [ ] **Step 2: Write failing tests**

Add to `projects/packages/sync/tests/php/modules/Module_Test.php` (or create a new `Search_Module_Test.php` in the same directory if the existing file tests a different module):

```php
public function test_ai_cpts_not_in_whitelist_when_search_disabled() {
    // Ensure filter returns false (default).
    $list = apply_filters( 'jetpack_sync_post_types_whitelist', array() );
    $this->assertNotContains( 'jp_search_behavior', $list );
    $this->assertNotContains( 'jetpack_search_topic', $list );
}

public function test_ai_cpts_in_whitelist_when_search_enabled() {
    add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
    $list = apply_filters( 'jetpack_sync_post_types_whitelist', array() );
    remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
    $this->assertContains( 'jp_search_behavior', $list );
    $this->assertContains( 'jetpack_search_topic', $list );
}

public function test_ai_topic_meta_in_whitelist_when_search_enabled() {
    add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
    $list = apply_filters( 'jetpack_sync_post_meta_whitelist', array() );
    remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
    $this->assertContains( '_jstopic_keywords', $list );
    $this->assertContains( '_jstopic_url', $list );
}
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
jetpack test php packages/sync -v --filter=test_ai_cpts
```

Expected: FAIL.

- [ ] **Step 4: Add sync hooks to `class-search.php`**

In `projects/packages/sync/src/modules/class-search.php`, in the `__construct()` method, add after the existing `add_filter` calls:

```php
public function __construct() {
    // existing hooks:
    add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'add_search_post_meta_whitelist' ), 10 );
    add_filter( 'jetpack_sync_options_whitelist', array( $this, 'add_search_options_whitelist' ), 10 );
    // new hooks:
    add_filter( 'jetpack_sync_post_types_whitelist', array( $this, 'add_ai_answer_post_types' ), 10 );
    add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'add_ai_answer_post_meta' ), 10 );
}
```

Then add the two new methods anywhere after `add_search_options_whitelist()`:

```php
/**
 * Add AI Answer CPTs to the post types sync whitelist.
 * Only added when the jetpack_search_ai_answers_enabled filter returns true,
 * which the Search package sets when Search is active.
 *
 * @param array $list Existing post types whitelist.
 * @return array Updated whitelist.
 */
public function add_ai_answer_post_types( $list ) {
    if ( ! apply_filters( 'jetpack_search_ai_answers_enabled', false ) ) {
        return $list;
    }
    $list[] = 'jp_search_behavior';
    $list[] = 'jetpack_search_topic';
    return $list;
}

/**
 * Add AI topic postmeta keys to the sync whitelist.
 *
 * @param array $list Existing postmeta whitelist.
 * @return array Updated whitelist.
 */
public function add_ai_answer_post_meta( $list ) {
    if ( ! apply_filters( 'jetpack_search_ai_answers_enabled', false ) ) {
        return $list;
    }
    $list[] = '_jstopic_keywords';
    $list[] = '_jstopic_url';
    return $list;
}
```

- [ ] **Step 5: Run tests**

```bash
jetpack test php packages/sync -v --filter=test_ai_cpts
```

Expected: All 3 tests PASS.

- [ ] **Step 6: Run the full sync test suite to check for regressions**

```bash
jetpack test php packages/sync -v
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add projects/packages/sync/src/modules/class-search.php projects/packages/sync/tests/php/modules/Module_Test.php
git commit -m "Sync: add jp_search_behavior and jetpack_search_topic CPTs to Search sync module"
```

---

## Task 3: Embed HMAC Token in Overlay Options

**Files:**
- Modify: `src/class-helper.php`
- Test: `tests/php/AI_Answers_Test.php`

- [ ] **Step 1: Add tests to `AI_Answers_Test.php`**

```php
public function test_hmac_token_not_generated_when_disabled() {
    // Feature disabled by default.
    $state = Helper::generate_initial_javascript_state();
    $this->assertArrayNotHasKey( 'aiAnswersToken', $state );
}

public function test_hmac_token_generated_when_enabled() {
    add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );

    // Mock the blog token — Helper::get_wpcom_site_id() may return 0 in tests,
    // so we focus on the key being present with a non-empty string value.
    $state = Helper::generate_initial_javascript_state();
    remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );

    $this->assertArrayHasKey( 'aiAnswersToken', $state );
    $this->assertNotEmpty( $state['aiAnswersToken'] );
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
jetpack test php packages/search -v --filter=test_hmac_token
```

Expected: FAIL — `aiAnswersToken` key not present.

- [ ] **Step 3: Add token generation to `class-helper.php`**

In `src/class-helper.php`, find `generate_initial_javascript_state()`. Near the end of the method, before the closing `return $options;`, add:

```php
// AI Answers: embed site-level hourly HMAC token for anonymous visitors.
if ( AI_Answers::is_enabled() ) {
    $blog_token = \Automattic\Jetpack\Connection\Tokens::get_access_token( JETPACK_MASTER_USER );
    if ( $blog_token && ! empty( $blog_token->secret ) ) {
        $site_id                 = \Jetpack_Options::get_option( 'id', 0 );
        $options['aiAnswersToken'] = hash_hmac(
            'sha256',
            'search-answers:' . $site_id . ':' . floor( time() / 3600 ),
            $blog_token->secret
        );
        $options['aiAnswersSiteId'] = (int) $site_id;
    }
}
```

Also add the `use` import at the top of the class file if not already present (check if `Tokens` is already imported).

- [ ] **Step 4: Run tests**

```bash
jetpack test php packages/search -v --filter=AI_Answers_Test
```

Expected: All tests PASS (the HMAC token test will pass if a blog token mock exists; if not, the token may be empty but the key will still be present — adjust the test assertion as needed based on the test bootstrap's mock setup).

- [ ] **Step 5: Commit**

```bash
git add src/class-helper.php tests/php/AI_Answers_Test.php
git commit -m "Search: embed HMAC AI Answers token in JetpackInstantSearchOptions"
```

---

## Task 4: Dashboard Tab Bar

**Files:**
- Create: `src/dashboard/components/tabs/index.jsx`
- Create: `src/dashboard/components/tabs/index.scss`
- Modify: `src/dashboard/components/pages/dashboard-page.jsx`

Stats-style tab bar: plain text tabs, blue bottom-border underline on the active tab, horizontal rule below the row.

- [ ] **Step 1: Create `src/dashboard/components/tabs/index.scss`**

```scss
.jp-search-dashboard-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid #dcdcde;
    margin-bottom: 24px;
}

.jp-search-dashboard-tabs__tab {
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: #3c434a;
    cursor: pointer;
    font-size: 14px;
    font-weight: 400;
    margin-bottom: -1px;
    padding: 12px 16px;
    text-decoration: none;

    &:hover {
        color: #1d2327;
    }

    &--active {
        border-bottom-color: #3858e9;
        color: #1d2327;
        font-weight: 600;
    }
}
```

- [ ] **Step 2: Create `src/dashboard/components/tabs/index.jsx`**

```jsx
import { __ } from '@wordpress/i18n';
import './index.scss';

const TABS = [
    { id: 'overview', label: __( 'Overview', 'jetpack-search-pkg' ) },
    { id: 'behavior', label: __( 'Behavior', 'jetpack-search-pkg' ) },
    { id: 'topics',   label: __( 'Topics', 'jetpack-search-pkg' ) },
];

/**
 * Stats-style tab bar for the Search dashboard.
 *
 * @param {object} props
 * @param {string} props.activeTab - The currently active tab id.
 * @param {Function} props.onTabChange - Called with the tab id when a tab is clicked.
 */
export default function DashboardTabs( { activeTab, onTabChange } ) {
    return (
        <div className="jp-search-dashboard-tabs" role="tablist">
            { TABS.map( tab => (
                <button
                    key={ tab.id }
                    role="tab"
                    aria-selected={ activeTab === tab.id }
                    className={
                        'jp-search-dashboard-tabs__tab' +
                        ( activeTab === tab.id ? ' jp-search-dashboard-tabs__tab--active' : '' )
                    }
                    onClick={ () => onTabChange( tab.id ) }
                >
                    { tab.label }
                </button>
            ) ) }
        </div>
    );
}

export { TABS };
```

- [ ] **Step 3: Write a Jest test for the tab component**

Create `tests/js/dashboard/tabs.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardTabs from 'components/tabs';

describe( 'DashboardTabs', () => {
    it( 'renders three tabs', () => {
        render( <DashboardTabs activeTab="overview" onTabChange={ jest.fn() } /> );
        expect( screen.getByText( 'Overview' ) ).toBeInTheDocument();
        expect( screen.getByText( 'Behavior' ) ).toBeInTheDocument();
        expect( screen.getByText( 'Topics' ) ).toBeInTheDocument();
    } );

    it( 'marks the active tab', () => {
        render( <DashboardTabs activeTab="behavior" onTabChange={ jest.fn() } /> );
        const active = screen.getByRole( 'tab', { name: 'Behavior' } );
        expect( active ).toHaveAttribute( 'aria-selected', 'true' );
    } );

    it( 'calls onTabChange when a tab is clicked', () => {
        const onChange = jest.fn();
        render( <DashboardTabs activeTab="overview" onTabChange={ onChange } /> );
        fireEvent.click( screen.getByText( 'Topics' ) );
        expect( onChange ).toHaveBeenCalledWith( 'topics' );
    } );
} );
```

- [ ] **Step 4: Run JS tests**

```bash
cd projects/packages/search && pnpm test-scripts -- --testPathPattern=tabs
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Integrate tabs into `dashboard-page.jsx`**

Add imports and `useState` at the top of `DashboardPage`:

```jsx
import { useState } from 'react';
import DashboardTabs from 'components/tabs';
import BehaviorTab from 'components/behavior-tab';
import TopicsTab from 'components/topics-tab';
```

Replace the `return (` block in `DashboardPage` with:

```jsx
const [ activeTab, setActiveTab ] = useState( 'overview' );

return (
    <div className="jp-search-dashboard-page">
        <AdminPage
            title={ 'Search' }
            subTitle={ __( 'Help your visitors find exactly what they are looking for.', 'jetpack-search-pkg' ) }
            actions={ /* existing actions JSX unchanged */ }
            apiRoot={ apiRoot }
            apiNonce={ apiNonce }
            className="uses-new-admin-ui"
            showFooter={ false }
        >
            <DashboardTabs activeTab={ activeTab } onTabChange={ setActiveTab } />

            { activeTab === 'overview' && (
                <>
                    { /* All existing dashboard content, unchanged */ }
                    <div className="jp-search-dashboard-top jp-search-dashboard-wrap">
                        { /* ... */ }
                    </div>
                    { /* ... rest of existing JSX */ }
                </>
            ) }

            { activeTab === 'behavior' && <BehaviorTab /> }
            { activeTab === 'topics'   && <TopicsTab /> }
        </AdminPage>
    </div>
);
```

Move the entire existing JSX inside `DashboardPage` under `activeTab === 'overview'`. Do not change the existing JSX — just wrap it in the conditional.

- [ ] **Step 6: Commit**

```bash
git add src/dashboard/components/tabs/ src/dashboard/components/pages/dashboard-page.jsx
git commit -m "Search: add Stats-style tab bar to Search dashboard (Overview / Behavior / Topics)"
```

---

## Task 5: Behavior Tab

**Files:**
- Create: `src/dashboard/components/behavior-tab/index.jsx`

Reads and writes the single `jp_search_behavior` post via the WP REST API. No full Gutenberg editor — a plain `<textarea>` is sufficient for instructions text.

- [ ] **Step 1: Create `src/dashboard/components/behavior-tab/index.jsx`**

```jsx
import apiFetch from '@wordpress/api-fetch';
import { Button, TextareaControl } from '@wordpress/components';
import { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';

const REST_BASE = '/wp/v2/jetpack-search-behavior';

export default function BehaviorTab() {
    const [ content, setContent ]   = useState( '' );
    const [ postId, setPostId ]     = useState( null );
    const [ isSaving, setIsSaving ] = useState( false );
    const [ isLoading, setIsLoading ] = useState( true );
    const [ error, setError ]       = useState( null );
    const [ saved, setSaved ]       = useState( false );

    useEffect( () => {
        apiFetch( { path: REST_BASE + '?per_page=1&status=any' } )
            .then( posts => {
                if ( posts.length > 0 ) {
                    setPostId( posts[ 0 ].id );
                    setContent( posts[ 0 ].content?.raw ?? '' );
                }
            } )
            .catch( err => setError( err.message ) )
            .finally( () => setIsLoading( false ) );
    }, [] );

    const save = () => {
        setIsSaving( true );
        setSaved( false );
        const path   = postId ? `${ REST_BASE }/${ postId }` : REST_BASE;
        const method = postId ? 'POST' : 'POST';
        apiFetch( {
            path,
            method,
            data: { content, status: 'publish', title: 'Search Behavior' },
        } )
            .then( post => {
                setPostId( post.id );
                setSaved( true );
            } )
            .catch( err => setError( err.message ) )
            .finally( () => setIsSaving( false ) );
    };

    if ( isLoading ) {
        return <p>{ __( 'Loading…', 'jetpack-search-pkg' ) }</p>;
    }

    return (
        <div className="jp-search-behavior-tab">
            <p className="jp-search-behavior-tab__description">
                { __(
                    'Describe how the AI should respond to visitor questions. List the topics your site covers so the AI can classify queries.',
                    'jetpack-search-pkg'
                ) }
            </p>
            <p className="jp-search-behavior-tab__example">
                <em>
                    { __( 'Example: "Focus on product-related questions. Topics: Shipping, Returns, Account Access, Billing."', 'jetpack-search-pkg' ) }
                </em>
            </p>
            { error && <p className="jp-search-behavior-tab__error">{ error }</p> }
            <TextareaControl
                label={ __( 'Behavior instructions', 'jetpack-search-pkg' ) }
                value={ content }
                onChange={ setContent }
                rows={ 10 }
                disabled={ isSaving }
            />
            <Button variant="primary" onClick={ save } isBusy={ isSaving } disabled={ isSaving }>
                { __( 'Save', 'jetpack-search-pkg' ) }
            </Button>
            { saved && <span className="jp-search-behavior-tab__saved">{ __( 'Saved.', 'jetpack-search-pkg' ) }</span> }
        </div>
    );
}
```

- [ ] **Step 2: Write a Jest test**

Create `tests/js/dashboard/behavior-tab.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import BehaviorTab from 'components/behavior-tab';

jest.mock( '@wordpress/api-fetch' );

describe( 'BehaviorTab', () => {
    it( 'shows loading state initially', () => {
        apiFetch.mockResolvedValueOnce( [] );
        render( <BehaviorTab /> );
        expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
    } );

    it( 'populates textarea from existing post', async () => {
        apiFetch.mockResolvedValueOnce( [
            { id: 1, content: { raw: 'Focus on products.' } },
        ] );
        render( <BehaviorTab /> );
        await waitFor( () =>
            expect( screen.getByRole( 'textbox' ) ).toHaveValue( 'Focus on products.' )
        );
    } );

    it( 'shows empty textarea when no post exists', async () => {
        apiFetch.mockResolvedValueOnce( [] );
        render( <BehaviorTab /> );
        await waitFor( () =>
            expect( screen.getByRole( 'textbox' ) ).toHaveValue( '' )
        );
    } );
} );
```

- [ ] **Step 3: Run JS tests**

```bash
cd projects/packages/search && pnpm test-scripts -- --testPathPattern=behavior-tab
```

Expected: All 3 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/dashboard/components/behavior-tab/
git commit -m "Search: add Behavior tab for AI Answers search behavior instructions"
```

---

## Task 6: Topics Tab

**Files:**
- Create: `src/dashboard/components/topics-tab/index.jsx`

Fetches `jetpack_search_topic` posts via REST and renders a simple list table with links to the native WP post editor for create/edit.

- [ ] **Step 1: Create `src/dashboard/components/topics-tab/index.jsx`**

```jsx
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';

const REST_BASE = '/wp/v2/jetpack-search-topics';

export default function TopicsTab() {
    const [ topics, setTopics ]     = useState( [] );
    const [ isLoading, setIsLoading ] = useState( true );
    const [ error, setError ]       = useState( null );

    const adminUrl =
        window.JETPACK_SEARCH_DASHBOARD_INITIAL_STATE?.siteData?.adminUrl ?? '/wp-admin/';

    const loadTopics = () => {
        setIsLoading( true );
        apiFetch( { path: REST_BASE + '?per_page=100&status=any' } )
            .then( setTopics )
            .catch( err => setError( err.message ) )
            .finally( () => setIsLoading( false ) );
    };

    useEffect( loadTopics, [] );

    const deleteTopic = id => {
        apiFetch( { path: `${ REST_BASE }/${ id }`, method: 'DELETE' } )
            .then( loadTopics )
            .catch( err => setError( err.message ) );
    };

    const newTopicUrl = `${ adminUrl }post-new.php?post_type=jetpack_search_topic`;
    const editUrl     = id => `${ adminUrl }post.php?post=${ id }&action=edit`;

    if ( isLoading ) {
        return <p>{ __( 'Loading…', 'jetpack-search-pkg' ) }</p>;
    }

    return (
        <div className="jp-search-topics-tab">
            <div className="jp-search-topics-tab__header">
                <Button variant="primary" href={ newTopicUrl }>
                    { __( 'Add Topic', 'jetpack-search-pkg' ) }
                </Button>
            </div>
            { error && <p className="jp-search-topics-tab__error">{ error }</p> }
            { topics.length === 0 ? (
                <p>{ __( 'No topics yet. Add a topic to help the AI answer visitor questions.', 'jetpack-search-pkg' ) }</p>
            ) : (
                <table className="widefat jp-search-topics-tab__table">
                    <thead>
                        <tr>
                            <th>{ __( 'Topic', 'jetpack-search-pkg' ) }</th>
                            <th>{ __( 'Keywords', 'jetpack-search-pkg' ) }</th>
                            <th>{ __( 'Last Modified', 'jetpack-search-pkg' ) }</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        { topics.map( topic => (
                            <tr key={ topic.id }>
                                <td>
                                    <a href={ editUrl( topic.id ) }>
                                        { topic.title?.rendered || __( '(no title)', 'jetpack-search-pkg' ) }
                                    </a>
                                </td>
                                <td>{ topic.meta?._jstopic_keywords ?? '' }</td>
                                <td>{ new Date( topic.modified ).toLocaleDateString() }</td>
                                <td>
                                    <Button
                                        variant="link"
                                        isDestructive
                                        onClick={ () => deleteTopic( topic.id ) }
                                    >
                                        { __( 'Delete', 'jetpack-search-pkg' ) }
                                    </Button>
                                </td>
                            </tr>
                        ) ) }
                    </tbody>
                </table>
            ) }
        </div>
    );
}
```

- [ ] **Step 2: Write a Jest test**

Create `tests/js/dashboard/topics-tab.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import TopicsTab from 'components/topics-tab';

jest.mock( '@wordpress/api-fetch' );

describe( 'TopicsTab', () => {
    it( 'shows empty state when no topics exist', async () => {
        apiFetch.mockResolvedValueOnce( [] );
        render( <TopicsTab /> );
        await waitFor( () =>
            expect( screen.getByText( /No topics yet/ ) ).toBeInTheDocument()
        );
    } );

    it( 'renders topic rows', async () => {
        apiFetch.mockResolvedValueOnce( [
            { id: 1, title: { rendered: 'Shipping' }, meta: { _jstopic_keywords: 'delivery,shipping' }, modified: '2026-04-01T00:00:00' },
        ] );
        render( <TopicsTab /> );
        await waitFor( () =>
            expect( screen.getByText( 'Shipping' ) ).toBeInTheDocument()
        );
        expect( screen.getByText( 'delivery,shipping' ) ).toBeInTheDocument();
    } );
} );
```

- [ ] **Step 3: Run JS tests**

```bash
cd projects/packages/search && pnpm test-scripts -- --testPathPattern=topics-tab
```

Expected: Both tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/dashboard/components/topics-tab/
git commit -m "Search: add Topics tab for AI Answers topic management"
```

---

## Task 7: Overlay Answers Panel (Render States)

**Files:**
- Create: `src/instant-search/components/answers-panel.jsx`
- Create: `src/instant-search/components/answers-panel.scss`

The panel has five states: `idle` (nothing), `loading` (spinner), `streaming` (partial answer), `done` (full answer + citations), `error` (hidden). It sits above `SearchResults` inside `SearchApp`.

- [ ] **Step 1: Create `src/instant-search/components/answers-panel.scss`**

```scss
.jp-search-answers-panel {
    border-bottom: 1px solid #dcdcde;
    margin-bottom: 16px;
    padding-bottom: 16px;
}

.jp-search-answers-panel__loading {
    align-items: center;
    color: #787c82;
    display: flex;
    font-size: 13px;
    gap: 8px;
}

.jp-search-answers-panel__text {
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
}

.jp-search-answers-panel__citations {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
}

.jp-search-answers-panel__citations li {
    font-size: 12px;
    margin-bottom: 4px;
}

.jp-search-answers-panel__citations a {
    color: #2271b1;
    text-decoration: underline;
}
```

- [ ] **Step 2: Create `src/instant-search/components/answers-panel.jsx`**

```jsx
import { __ } from '@wordpress/i18n';
import './answers-panel.scss';

/**
 * AI Answers panel displayed above search results.
 *
 * @param {object}   props
 * @param {string}   props.status    - 'idle' | 'loading' | 'streaming' | 'done' | 'error'
 * @param {string}   props.text      - Accumulated answer text.
 * @param {Array}    props.citations - Array of {title, url, excerpt} from the done event.
 */
export default function AnswersPanel( { status, text, citations } ) {
    if ( status === 'idle' || status === 'error' ) {
        return null;
    }

    return (
        <div className="jp-search-answers-panel" aria-live="polite">
            { status === 'loading' && (
                <div className="jp-search-answers-panel__loading">
                    { __( 'Finding an answer…', 'jetpack-search-pkg' ) }
                </div>
            ) }

            { ( status === 'streaming' || status === 'done' ) && (
                <>
                    <p className="jp-search-answers-panel__text">{ text }</p>
                    { status === 'done' && citations?.length > 0 && (
                        <ul className="jp-search-answers-panel__citations">
                            { citations.map( ( c, i ) => (
                                <li key={ i }>
                                    <a href={ c.url } target="_blank" rel="noopener noreferrer">
                                        { c.title }
                                    </a>
                                </li>
                            ) ) }
                        </ul>
                    ) }
                </>
            ) }
        </div>
    );
}
```

- [ ] **Step 3: Write a Jest test**

Create `tests/js/instant-search/answers-panel.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import AnswersPanel from 'components/answers-panel';

describe( 'AnswersPanel', () => {
    it( 'renders nothing when idle', () => {
        const { container } = render(
            <AnswersPanel status="idle" text="" citations={ [] } />
        );
        expect( container.firstChild ).toBeNull();
    } );

    it( 'renders nothing on error', () => {
        const { container } = render(
            <AnswersPanel status="error" text="" citations={ [] } />
        );
        expect( container.firstChild ).toBeNull();
    } );

    it( 'shows loading message', () => {
        render( <AnswersPanel status="loading" text="" citations={ [] } /> );
        expect( screen.getByText( 'Finding an answer…' ) ).toBeInTheDocument();
    } );

    it( 'shows streamed text', () => {
        render( <AnswersPanel status="streaming" text="Here is how to…" citations={ [] } /> );
        expect( screen.getByText( 'Here is how to…' ) ).toBeInTheDocument();
    } );

    it( 'shows full text and citations when done', () => {
        const citations = [ { title: 'Reset Password', url: '/reset', excerpt: '' } ];
        render( <AnswersPanel status="done" text="Reset here." citations={ citations } /> );
        expect( screen.getByText( 'Reset here.' ) ).toBeInTheDocument();
        expect( screen.getByText( 'Reset Password' ) ).toBeInTheDocument();
    } );
} );
```

- [ ] **Step 4: Run JS tests**

```bash
cd projects/packages/search && pnpm test-scripts -- --testPathPattern=answers-panel
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/instant-search/components/answers-panel.jsx src/instant-search/components/answers-panel.scss
git commit -m "Search: add AI Answers panel component for instant-search overlay"
```

---

## Task 8: Overlay SSE Connection

**Files:**
- Modify: `src/instant-search/components/search-app.jsx`
- Modify: `package.json`

Wires the `AnswersPanel` into the overlay and connects it to the wpcom AI agent endpoint using `fetchEventSource`. The AI request fires debounced on query change, is aborted on new query, and is gated by `aiAnswersToken` being present in `window.JetpackInstantSearchOptions`.

- [ ] **Step 1: Add `@microsoft/fetch-event-source` to `package.json`**

```bash
cd projects/packages/search && pnpm add @microsoft/fetch-event-source
```

Verify it appears in `package.json` dependencies.

- [ ] **Step 2: Add AI answers state and SSE logic to `SearchApp`**

In `src/instant-search/components/search-app.jsx`, make the following changes:

**Import additions** (at the top, with other imports):

```js
import { fetchEventSource } from '@microsoft/fetch-event-source';
import AnswersPanel from './answers-panel';
```

**Add to class state** in the constructor, after the existing `this.state = { isVisible, ... }`:

```js
this.state = {
    isVisible: !! this.props.initialIsVisible,
    overlayOptionsCustomizerOverride: {},
    // AI Answers state
    aiStatus: 'idle',      // 'idle' | 'loading' | 'streaming' | 'done' | 'error'
    aiText: '',
    aiCitations: [],
};
this.aiController = null;
this.getAiAnswer = debounce( this.getAiAnswer, 400 );
```

**Add `getAiAnswer` method** to the class:

```js
getAiAnswer = () => {
    const query      = this.props.searchQuery;
    const options    = window[ SERVER_OBJECT_NAME ] || {};
    const token      = options.aiAnswersToken;
    const siteId     = options.aiAnswersSiteId || options.siteId;

    // Only fire if feature is enabled and query is long enough.
    if ( ! token || ! query || query.length < 3 ) {
        this.setState( { aiStatus: 'idle', aiText: '', aiCitations: [] } );
        return;
    }

    // Abort any in-flight request.
    if ( this.aiController ) {
        this.aiController.abort();
    }
    this.aiController = new AbortController();

    this.setState( { aiStatus: 'loading', aiText: '', aiCitations: [] } );

    const url = `https://public-api.wordpress.com/wpcom/v2/sites/${ siteId }/ai/agent/jetpack-search-answers`;

    fetchEventSource( url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ token }`,
        },
        body: JSON.stringify( {
            query,
            filters: this.props.filters,
            locale: options.locale || 'en',
        } ),
        signal: this.aiController.signal,
        onopen( response ) {
            if ( ! response.ok ) {
                throw new Error( `HTTP ${ response.status }` );
            }
        },
        onmessage: event => {
            try {
                const data = JSON.parse( event.data );
                if ( data.type === 'chunk' ) {
                    this.setState( state => ( {
                        aiStatus: 'streaming',
                        aiText: state.aiText + data.text,
                    } ) );
                } else if ( data.type === 'done' ) {
                    this.setState( { aiStatus: 'done', aiCitations: data.citations || [] } );
                } else if ( data.type === 'error' ) {
                    this.setState( { aiStatus: 'error' } );
                }
            } catch ( _e ) {
                // Ignore unparseable events.
            }
        },
        onerror: () => {
            this.setState( { aiStatus: 'error' } );
            throw new Error( 'SSE error' ); // fetchEventSource retries unless you throw
        },
    } ).catch( () => {
        if ( ! this.aiController?.signal?.aborted ) {
            this.setState( { aiStatus: 'error' } );
        }
    } );
};
```

**Trigger `getAiAnswer` on query change** in `componentDidUpdate`, add after the existing `onChangeQueryString` call:

```js
if ( prevProps.searchQuery !== this.props.searchQuery ) {
    this.getAiAnswer();
}
```

**Render `AnswersPanel`** inside the `Overlay`, above `SearchResults`. Find this in the `render()` method:

```jsx
<Overlay ...>
    <SearchResults ... />
</Overlay>
```

Replace with:

```jsx
<Overlay ...>
    <AnswersPanel
        status={ this.state.aiStatus }
        text={ this.state.aiText }
        citations={ this.state.aiCitations }
    />
    <SearchResults ... />
</Overlay>
```

**Abort on unmount** — add `componentWillUnmount`:

```js
componentWillUnmount() {
    if ( this.aiController ) {
        this.aiController.abort();
    }
    this.getAiAnswer.cancel();
}
```

- [ ] **Step 3: Write a Jest test for the SSE wiring**

Create `tests/js/instant-search/search-app-ai.test.jsx`:

```jsx
import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import SearchApp from 'components/search-app';

jest.mock( '@microsoft/fetch-event-source' );

const mockStore = configureStore( [] );
const baseProps = {
    overlayOptions: {},
    widgets: [],
    filters: {},
    staticFilters: {},
    hasActiveQuery: false,
    hasError: false,
    isHistoryNavigation: false,
    hasNextPage: false,
    isLoading: false,
    response: {},
    searchQuery: '',
    sort: 'relevance',
    widgetOutsideOverlay: null,
    options: { siteId: 1, postsPerPage: 10, isPhotonEnabled: false, isPrivateSite: false },
    themeOptions: { searchInputSelector: '.search-input' },
    clearQueryValues: jest.fn(),
    disableQueryStringIntegration: jest.fn(),
    initializeQueryValues: jest.fn(),
    makeSearchRequest: jest.fn(),
    setStaticFilter: jest.fn(),
    setFilter: jest.fn(),
    setSearchQuery: jest.fn(),
    setSort: jest.fn(),
    shouldIntegrateWithDom: false,
    shouldCreatePortal: false,
    enableAnalytics: false,
};

beforeEach( () => {
    window.JetpackInstantSearchOptions = { aiAnswersToken: 'test-token', aiAnswersSiteId: 1 };
    fetchEventSource.mockResolvedValue( undefined );
} );

it( 'does not fire AI request for short queries', async () => {
    const store = mockStore( {} );
    render(
        <Provider store={ store }>
            <SearchApp { ...baseProps } searchQuery="hi" />
        </Provider>
    );
    expect( fetchEventSource ).not.toHaveBeenCalled();
} );

it( 'fires AI request when query is at least 3 characters', async () => {
    const store = mockStore( {} );
    render(
        <Provider store={ store }>
            <SearchApp { ...baseProps } searchQuery="how to reset password" />
        </Provider>
    );
    // Allow debounce to fire
    await act( async () => { jest.runAllTimers(); } );
    expect( fetchEventSource ).toHaveBeenCalledWith(
        expect.stringContaining( '/ai/agent/jetpack-search-answers' ),
        expect.objectContaining( { method: 'POST' } )
    );
} );
```

Note: `jest.useFakeTimers()` must be called in `beforeEach` for the debounce test to work. Add at the top of the test file:

```js
beforeEach( () => {
    jest.useFakeTimers();
    // ...
} );
afterEach( () => { jest.useRealTimers(); } );
```

- [ ] **Step 4: Run JS tests**

```bash
cd projects/packages/search && pnpm test-scripts -- --testPathPattern=search-app-ai
```

Expected: Both tests PASS.

- [ ] **Step 5: Build to verify no compilation errors**

```bash
cd projects/packages/search && pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/instant-search/components/search-app.jsx package.json pnpm.lock
git commit -m "Search: wire AI Answers SSE to instant-search overlay via fetchEventSource"
```

---

## Task 9: Changelogs

- [ ] **Step 1: Add changelog for search package**

```bash
jp changelog add packages/search -s minor -t added -e "Search: AI Answers — topic-based customization CPTs, HMAC auth token, dashboard tabs, and streaming answers panel in the instant-search overlay."
```

- [ ] **Step 2: Add changelog for sync package**

```bash
jp changelog add packages/sync -s patch -t added -e "Sync: sync jp_search_behavior and jetpack_search_topic CPTs when Jetpack Search AI Answers is enabled."
```

- [ ] **Step 3: Commit changelogs**

```bash
git add changelog/
git commit -m "Search, Sync: add changelogs for AI Answers feature"
```

---

## Testing the Full Feature End-to-End

Once the wpcom agent is live (Spec A implementation complete):

1. Enable the feature: `wp option update jetpack_search_ai_answers_enabled 1`
2. Navigate to **Jetpack → Search → Behavior** and enter instructions
3. Navigate to **Jetpack → Search → Topics**, add a topic with example questions
4. Open the instant-search overlay on the site frontend, type a query matching the topic
5. Verify: loading spinner appears, tokens stream in, citations shown on completion
6. Verify: queries not matching any topic still stream an answer from search context
7. Verify: after 500 requests the panel silently hides and search results still display

Run both test suites before opening a PR:

```bash
jetpack test php packages/search -v
jetpack test php packages/sync -v
cd projects/packages/search && pnpm test
```
