# Changelog

## [1.15.0](https://github.com/unstable-studios/dashboard/compare/dashboard-v1.14.0...dashboard-v1.15.0) (2026-02-01)


### Features

* add release-please and Auth0 terraform stack ([#2](https://github.com/unstable-studios/dashboard/issues/2)) ([c3f2af2](https://github.com/unstable-studios/dashboard/commit/c3f2af270a4ec14bf89fc4dfe144ae63cd1ef8fc))
* add user content isolation for personal tier ([#1](https://github.com/unstable-studios/dashboard/issues/1)) ([729f19b](https://github.com/unstable-studios/dashboard/commit/729f19bd559b99387ea89238148ce5f3dc94b795))
* **auth0:** use organization login flow for internal apps ([#60](https://github.com/unstable-studios/dashboard/issues/60)) ([4e5e64d](https://github.com/unstable-studios/dashboard/commit/4e5e64d46417e004b7e3cab0cca6a192c13b343e))
* **echo-hub:** add automatic D1 migrations to CI/CD ([#43](https://github.com/unstable-studios/dashboard/issues/43)) ([4e6d9c0](https://github.com/unstable-studios/dashboard/commit/4e6d9c0255b85f16c073cc2cc8f16727f104be27))
* **echo-hub:** add bar view mode with per-section view preferences ([#81](https://github.com/unstable-studios/dashboard/issues/81)) ([aae8ee6](https://github.com/unstable-studios/dashboard/commit/aae8ee6d6370116c7489b16ba1862003030a9658))
* **echo-hub:** add calendar/reminders feature ([#35](https://github.com/unstable-studios/dashboard/issues/35)) ([4a18079](https://github.com/unstable-studios/dashboard/commit/4a180799fac0b781c15a7533b221590ef8e1d268))
* **echo-hub:** add drag-and-drop reordering for grid view ([#72](https://github.com/unstable-studios/dashboard/issues/72)) ([79fc829](https://github.com/unstable-studios/dashboard/commit/79fc829a0602519b894ff04808f8c661d713d8c7))
* **echo-hub:** add drag-and-drop reordering for pinned items ([#67](https://github.com/unstable-studios/dashboard/issues/67)) ([b66f2dc](https://github.com/unstable-studios/dashboard/commit/b66f2dcb6bc45644eb3520b4670b0b424ebca980))
* **echo-hub:** add email reminders via Postmark ([#74](https://github.com/unstable-studios/dashboard/issues/74)) ([774f336](https://github.com/unstable-studios/dashboard/commit/774f336ee73b4481fe652cbc20e41de8610066e4))
* **echo-hub:** add feature flags for personal vs enterprise tiers ([15fe964](https://github.com/unstable-studios/dashboard/commit/15fe964895ace24fab297f7a2f4c52d6807f30b1))
* **echo-hub:** add new user onboarding flow ([d5095f7](https://github.com/unstable-studios/dashboard/commit/d5095f79a0a403f7141798187875a631b7795ae7))
* **echo-hub:** polish login page design ([#65](https://github.com/unstable-studios/dashboard/issues/65)) ([19f66d5](https://github.com/unstable-studios/dashboard/commit/19f66d5ddee7c6564eef7ef20494f5c5574e13d1))
* **echo-hub:** reminder completion, history, and UI polish ([#82](https://github.com/unstable-studios/dashboard/issues/82)) ([89681ad](https://github.com/unstable-studios/dashboard/commit/89681ad4b55169cb92a4c103fcb1e6e9d3d564a6))
* **echo-hub:** UX improvements with document combobox and version history ([#55](https://github.com/unstable-studios/dashboard/issues/55)) ([dd8f474](https://github.com/unstable-studios/dashboard/commit/dd8f47466a5767cc916544d1b0cd064985931b79))
* **echo-hub:** UX improvements with view toggle and dashboard reminders ([#48](https://github.com/unstable-studios/dashboard/issues/48)) ([68c1854](https://github.com/unstable-studios/dashboard/commit/68c185426feb7a207e6a4d6fd85f75728211b20b))
* integrate echo-hub and Auth0 Terraform ([#7](https://github.com/unstable-studios/dashboard/issues/7)) ([d18be4c](https://github.com/unstable-studios/dashboard/commit/d18be4cb68449e499aa2a652948e321daa0f50df))
* rename Auth0 app vars to AUTH0_APP_* prefix ([#5](https://github.com/unstable-studios/dashboard/issues/5)) ([37e88fe](https://github.com/unstable-studios/dashboard/commit/37e88fe0817dc1e48ac90bdd0bbe0afb5bfd776c))


### Bug Fixes

* **echo-hub:** align admin permission check with Auth0 scopes ([#26](https://github.com/unstable-studios/dashboard/issues/26)) ([d725f60](https://github.com/unstable-studios/dashboard/commit/d725f605b27fddcc7fbac42d1030ebcd113a0c6d))
* **echo-hub:** fix build errors and add build step to CI ([#50](https://github.com/unstable-studios/dashboard/issues/50)) ([d11c9fb](https://github.com/unstable-studios/dashboard/commit/d11c9fbb66ce23b5fcda96ddc3ab4b70288695b1))
* **echo-hub:** fix calendar.ics routing and SPA fallback ([#45](https://github.com/unstable-studios/dashboard/issues/45)) ([8e58c46](https://github.com/unstable-studios/dashboard/commit/8e58c46cde09530faaa10dbd9756da47437b1de4))
* **echo-hub:** improve iCal feed RFC 5545 compliance for Fantastical ([#41](https://github.com/unstable-studios/dashboard/issues/41)) ([408c594](https://github.com/unstable-studios/dashboard/commit/408c5948f268a1c7e9615595f57c93e636f6759d))
* **echo-hub:** make seed migrations skip if data exists ([#79](https://github.com/unstable-studios/dashboard/issues/79)) ([fcfdae6](https://github.com/unstable-studios/dashboard/commit/fcfdae6ef1b7cfddcc07b46e5e5e641e693a0862))
* **echo-hub:** prevent click after drag-and-drop ([#70](https://github.com/unstable-studios/dashboard/issues/70)) ([4adf6ac](https://github.com/unstable-studios/dashboard/commit/4adf6ac024439e2df2f388780d33f237a59cd7c5))
* **echo-hub:** recreate tables instead of dropping auto-indexes ([#77](https://github.com/unstable-studios/dashboard/issues/77)) ([ac7abf5](https://github.com/unstable-studios/dashboard/commit/ac7abf5e297d3a124b8b0af14af53e58f23d7572))
* **echo-hub:** wrap Lucide icons in span for title tooltip ([#39](https://github.com/unstable-studios/dashboard/issues/39)) ([1ea1934](https://github.com/unstable-studios/dashboard/commit/1ea193413f143b5232e0ee36e7a3a652f303d4a6))
