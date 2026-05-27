# Strategy — Akismet as the WordPress Trust Layer

**Author:** Devin Walker (devin.walker@a8c.com)
**Status:** Working thesis for the UI exploration. Not (yet) sanctioned product strategy. Discuss, push back, iterate.
**Last updated:** 2026-05-27

---

## The one-line thesis

> Akismet's brand, distribution, and trust position in WordPress are bigger than its product surface area. **Blackbox is the technology that lets Akismet expand from "comment spam filter" to "WordPress trust layer" — protecting against the full spectrum of bad-actor traffic, with WooCommerce fraud as the wedge market.**

The UI exploration in this directory is the prototype that makes that thesis tangible.

---

## What Akismet has today

| Asset | Detail |
| --- | --- |
| **Distribution** | Bundled in WordPress core via SVN external. Active on ~5M+ sites. Almost zero acquisition friction. |
| **Brand trust** | Sixteen years of operating as "the safety net for WordPress." Site owners install it without reading a comparison post. |
| **Pricing surface** | Paid tiers for commercial sites. Free for personal. Existing billing, existing renewal flow. |
| **Training corpus** | One of the largest abuse-content datasets in the world. Strong moat. |

| Limit | Detail |
| --- | --- |
| **Surface is narrow** | Comment spam only. Doesn't touch logins, signups, checkouts, forms, bots, scraping. |
| **Surface is shrinking** | Comments are a declining share of total site abuse, especially for ecommerce and authenticated sites. |
| **Invisibility cuts both ways** | "It just works in the background" is great for retention; bad for upsell because site owners can't see what they're getting. |

## What Blackbox brings

| Asset | Detail |
| --- | --- |
| **Pre-action evaluation** | Scores the visitor *before* they do something — vs. Akismet scoring the artifact (comment) after. Lets us prevent abuse instead of cleaning it up. |
| **Cross-action identity** | Stable opaque `visitor_id` joins behavior across logins, checkouts, comments, signups. Akismet has never had this. |
| **Challenge widget** | Shadow-DOM honeypot checkbox — the friction-free Cloudflare-Turnstile equivalent. New capability Akismet has never had. |
| **Server-side rules + Bayesian scoring** | ~20+ rules across browser-integrity, network reputation, velocity. Authored centrally; site doesn't have to manage them. |
| **Edge fingerprinting** | JA4T TCP/TLS at the CDN. Catches automation before it ever loads a page. |
| **Real production traction** | Already live on ~7% of WPCOM login traffic and shipping in WooCommerce 10.6 alpha (Woo Fraud Protection v0.1.x). |

| Limit | Detail |
| --- | --- |
| **No end-user brand** | Site owners haven't heard of Blackbox. The technology has no consumer pull. |
| **No distribution outside a8c-internal** | Currently a service consumed by other a8c products. Not packaged for third-party WP sites. |
| **No user-facing UI** | Pure infrastructure. Whatever surfaces it ends up with belong to its consumers (WooFraud, WPCOM login, Tumblr, etc.). |

**The complement is exact.** Akismet has the brand, distribution, and end-user surface. Blackbox has the technology to extend that surface. Both teams are inside Safety & Filtering. Nobody has to acquire anyone.

## The pivot — six categories

| Category | Today on a typical WP site | Under Akismet + Blackbox |
| --- | --- | --- |
| **Comments** | Akismet (mature; ~99% effective) | Akismet, unchanged. Continues as the anchor. |
| **Forms** (contact, registration, custom) | Mix of Akismet partial coverage + reCAPTCHA + Cloudflare Turnstile + nothing | Akismet (Blackbox-powered; pre-submit challenge instead of post-submit captcha). Replaces reCAPTCHA. |
| **Logins** (credential stuffing, password spray, account takeover) | Wordfence / Limit Login Attempts / Jetpack Protect / nothing | Akismet (Blackbox at `wp-login.php`). Challenges the 7% most-suspicious traffic; blocks the worst. |
| **Checkouts / Fraud** | WooPayments fraud + FraudLabs Pro + custom | Akismet (Blackbox + Woo Fraud Protection). Already integrated upstream — surfacing it in Akismet's UI tells the story to merchants. |
| **Bots / Scraping** | Cloudflare / Wordfence / nothing | Akismet (Blackbox edge + JA4T fingerprints). Catches automation before it loads the page. |
| **Brute-force / Automated abuse** | Wordfence / Limit Login Attempts / nothing | Akismet (Blackbox behavioral biometrics + velocity rules). |

Comment spam is one of six. The other five are net-new product surface for Akismet, with no brand stretch (everything in this table is "stopping bad guys" — Akismet's existing promise).

## Why WordPress is the right ecosystem to do this in

| Factor | Why it matters |
| --- | --- |
| **Fragmentation** | WP security is split across Wordfence, Sucuri, iThemes, Jetpack Protect, WooCommerce fraud tools — none with end-to-end coverage. There's room for an integrator. |
| **Akismet's distribution** | Already in core. No installation step. New protection categories light up *for sites that already have Akismet*, which is most of them. |
| **Plugin economy** | Other plugins (forms, membership, ecommerce) can ship "uses Akismet" badges, the same way they ship "uses Stripe" today. Already in motion with Woo Fraud Protection. |
| **Ecommerce surface** | WooCommerce is the #1 ecommerce platform by site count. Fraud is high-dollar. Merchants will pay for protection they can see is working. |

## Wedge market — WooCommerce

WooCommerce is where the thesis becomes commercially obvious:

- **Fraud is measurable in dollars.** Merchants can compare "$X in chargebacks prevented" to "$Y in Akismet plan cost." Beats abstract "we blocked some spam."
- **Blackbox is already integrated upstream.** Woo Fraud Protection v0.1.x is in WC 10.6 alpha (Apr 2026). The technology works; the UI is the missing piece.
- **Pricing flexibility.** Existing Akismet commercial tiers can sprout a "Pro for Stores" SKU without inventing a new product.
- **Cross-sell to existing Akismet customers.** Stores already running Akismet for comments are the warmest possible audience for fraud protection.
- **Co-marketing with WooCommerce.** "Akismet for your WooCommerce store" is a story the Woo team can tell without rebranding.

**The Woo panel in the prototype's Overview tab is the most product-meaningful demo in this exploration**, because it's the only category where we can claim concrete dollar value today.

## Success criteria for the prototype

This exploration is internal R&D. We're not shipping to wp.org from this branch. The output is a working UI that lets us:

1. **Show the unified-threat picture to leadership / design / product reviewers and have them grok the pivot in under 60 seconds.** If the picture doesn't tell the story without narration, the UI is wrong (not the strategy).
2. **Demonstrate that the Akismet brand stretches.** Site owners shouldn't have to be told that "Akismet now does logins too" — the page should make it obvious that *of course* it does, because Akismet is what protects the site.
3. **Test the IA.** Six categories is the right number unless we discover it isn't. The category cards + Activity log + Woo panel pattern should hold up under reviewer pushback.
4. **Surface the dollar value.** Numbers in the Woo panel should map to chargebacks averted or attack patterns mitigated.
5. **Set up the architecture for what ships next.** Whoever picks up the production track inherits a real React app on a real REST surface and a real Blackbox integration shape — not a Figma deck.

The prototype is *not* trying to:

- Ship to wp.org. (That's a later decision.)
- Replace any existing security plugin. (That's a market choice for the product track.)
- Lock in pricing or packaging. (Out of scope.)
- Cover every edge case in every category. (Six categories with real-or-clearly-mocked data is enough to test the IA; production data wiring is the production team's problem.)

## Open product questions

The exploration deliberately *doesn't* answer these. Flagging so reviewers know they exist:

1. **Brand**: does it stay "Akismet" or does it become "Akismet Trust" / "Akismet for WordPress" / "WordPress Trust by Akismet"? The prototype uses "Akismet" plain to make the brand-stretch test honest.
2. **Pricing**: free tier coverage, commercial tier coverage, WooCommerce SKU? Out of scope.
3. **Cannibalization**: does this overlap with Jetpack Protect? Wordfence partnerships? Cloudflare Turnstile (which Automattic does not own)? Out of scope; product team's call.
4. **Plugin economy mechanics**: how do third-party plugins (Gravity Forms, MemberPress, etc.) opt into Akismet protection for their submission surfaces? Out of scope; design separately.
5. **Edge integration for self-hosted**: Blackbox's edge fingerprinting (`X-Edge-Blackbox-Score`) works for wpcom-routed traffic. What's the path for self-hosted WP sites? Out of scope.

## Coordination points

> ⚠️ **All outreach below is gated.** Per [GUARDRAILS.md](./GUARDRAILS.md), nothing is sent to any of these people until you (Devin) preview the running prototype and explicitly say "reach out to X." Drafts (PR bodies, Linear issue bodies, P2 posts) are prepared in this worktree as `.md` files; none of them are sent.

| Who | What | When |
| --- | --- | --- |
| **`cfinke`, `bluefuton`** (AKISMET eng) | Akismet plugin source path + release flow. Time-series endpoint spec ([endpoint-spec-stats-timeseries.md](./endpoint-spec-stats-timeseries.md)) review. | Post-preview, on go-ahead |
| **`@dtbecher`** (Blackbox lead) | Sanity-check the localized config shape. Aggregate query approach (single `/v1/aggregates` or roll up from `/v1/verify` logs). Sandbox client + Bearer key for the prototype if/when `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` gets exercised. | Post-preview, on go-ahead |
| **`@luizfreis`, `@tautvidas`** (Woo Fraud Protection) | What state the WC 10.6 alpha exposes (orders flagged, signals stored). Whether the prototype can read Woo Fraud state directly. | Post-preview, on go-ahead |
| **`keoshi`** (Jetpack design) | Page-shell parity with Backup / Scan / Activity Log. Whether the unified-threat IA fits the broader design system. | Post-preview, on go-ahead |
| **Anne McCarthy** (cross-team triage) | Whether this exploration warrants its own cross-functional triage entry, or rolls under existing AKISMET / Jetpack triage. | Post-preview, on go-ahead |

## What I want from reviewers of this thesis

- **Where does the brand stretch break?** What's the first category where "Akismet does this" sounds wrong?
- **What's missing from the six?** Are we under-counting forms? Should "Bots" and "Brute-force" merge?
- **What's the right name for the dollar-value claim?** "$X in chargebacks averted (estimated)" needs a methodology I can defend.
- **What's the WooCommerce path?** The Woo Fraud Protection plugin exists; is the right play to put the UI inside Akismet, inside Woo, both?
- **What kills it?** Three reasons not to do this. (Cannibalization story, support cost, pricing collisions, brand dilution, etc.)
