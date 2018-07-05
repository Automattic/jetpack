# Redirecting Upgrades Back to Hosting Partners

In an effort to minimize confusion for users and improve relations with our hosting partners, we have added the ability to redirect users who click on upgade prompts within the Jetpack plugin back to the hosting partner's checkout flow, as opposed to WordPress.com.

## What it looks like

For example, the typical upgrade path might look like this:

- User purchases hosting package
- User installs Jetpack
- User clicks on the upgrade prompt that shows for the Jetpack Search feature
- User is taken to WordPress.com where they can upgrade their plan in order to use Jetpack Search

In some cases, this is a less than ideal flow. One example would be when the hosting partner is bundling a Jetpack plan as part of the user's hosting package. In that case, if the user were to upgrade on WordPress.com it would result in the user now double-paying for a Jetpack plan, which could reflect poorly on the partnership between Jetpack and the hosting partner.

With the ability to redirect users to our hosting partners, the upgrade flow can look like this instead:

- User purchases hosting package
- User installs Jetpack
- User clicks on upgrade prompt that shows for Jetpack Search feature
- User is redirected to a page on the hosting partner's website where the user can upgrade their plan
- After purchasing on the hosting partner's website, the hosting partner upgrades the Jetpack plan behind the scenes and the user is able to use the Jetpack Search feature

In this flow, the user is only paying for the Jetpack plan once and the host still maintains the billing relationship.

## How it works

When a user clicks an upgrade button, as well as most other links in the Jetpack plugin, the user will end up going to a URL that looks something like this:

`https://jetpack.com/redirects?source=FOO&site=example.com`

With the above information, specifically the source and the site URL, we are able to determine the intent of the click as well as whether the user is coming from a site that has been registered with a hosting partner. We will redirect the user to the hosting partner's purchase/upgrade flow if all of the following conditions are met:

- The source must have purchase intent, meaning that the user would have landed on a purchase flow on WordPress.com
- The site needs to have been registered with the partners API, with or without a plan
- The hosting partner that registered the site needs to have provided us with URLs for their upgrade flows. Currently, we can specify URLs for the following:
  - Personal plan (the site does not have an existing plan)
  - Premium plan (the site is upgrading from personal)
  - Professional plan (the site is upgrading from premium)
  - A comparison page, where plan tiers are compared

## Get started

For hosting partners to get started with upgrade redirecting, there are only two steps:

1) Be sure to register all sites with the partner API
2) Send us the relevant purchase URLs for the personal, premium, and professional plans as well as a comparison page
