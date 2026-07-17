# Mixpanel events currently used

Last verified: **2026-07-16**

This document lists only Mixpanel events that have a reachable runtime call site in the current Next.js application. The audit starts at the active `page.tsx` and layout files, follows their imported components/hooks, and then matches calls to `trackEvent(MixpanelEvent.*)` against the enum in [`utils/mixpanel.ts`](../servers/nextjs/utils/mixpanel.ts#L7).

## Audit result

| Item | Count | Meaning |
|---|---:|---|
| Declared enum entries | 175 | Every member currently declared in `MixpanelEvent`. |
| Currently used events | **133** | Unique event names with a call site reachable from a current page or the root layout. These are the only events included below. |
| Declaration-only events | 39 | Enum members with no `trackEvent` call. They are intentionally omitted. |
| Calls in an unmounted component | 3 events | `ImageEditor.tsx` is not imported by the current app, so its tracking calls are intentionally omitted. |

There are no direct event-name calls through `track(...)`; all application tracking goes through `trackEvent(MixpanelEvent.*)`.

## How tracking works

1. The root layout mounts [`MixpanelInitializer`](../servers/nextjs/app/MixpanelInitializer.tsx#L7).
2. The initializer checks `/api/telemetry-status`. Tracking is suppressed when telemetry is disabled; if the status request fails, the code currently defaults to enabled.
3. Mixpanel is initialized against the EU API host, automatic page-view tracking is disabled, and `app_version` is registered when available. See [`mixpanel.ts`](../servers/nextjs/utils/mixpanel.ts#L238).
4. A manual `Page View` event is sent when the Next.js pathname changes.
5. Each page sends the action/result events detailed below. Error strings are generally passed through `sanitizeAnalyticsError(...)` before tracking.

## Route map

| Exact route | User-facing page | Page entry |
|---|---|---|
| All routes | Root layout / global tracking | [`app/layout.tsx`](../servers/nextjs/app/layout.tsx#L96) |
| `/` | Authentication or onboarding, depending on server auth/configuration state | [`app/page.tsx`](../servers/nextjs/app/page.tsx#L1) |
| `/dashboard` | Presentation dashboard | [`dashboard/page.tsx`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/dashboard/page.tsx#L1>) |
| `/settings` | Provider and application settings | [`settings/page.tsx`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/page.tsx#L1>) |
| `/templates` | Inbuilt/custom template gallery | [`templates/page.tsx`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/templates/page.tsx#L1>) |
| `/theme` | Theme gallery and theme editor | [`theme/page.tsx`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/page.tsx#L1>) |
| `/upload` | New-presentation configuration and source upload | [`upload/page.tsx`](<../servers/nextjs/app/(presentation-generator)/upload/page.tsx#L1>) |
| `/documents-preview` | Extracted-document preview | [`documents-preview/page.tsx`](<../servers/nextjs/app/(presentation-generator)/documents-preview/page.tsx#L1>) |
| `/outline` | Outline review, template selection, and outline assistant | [`outline/page.tsx`](<../servers/nextjs/app/(presentation-generator)/outline/page.tsx#L1>) |
| `/presentation?id=...` | Presentation editor and presentation mode | [`presentation/page.tsx`](<../servers/nextjs/app/(presentation-generator)/presentation/page.tsx#L1>) |
| `/template-preview?templateV2Id=...` | Template preview | [`template-preview/page.tsx`](<../servers/nextjs/app/(presentation-generator)/template-preview/page.tsx#L1>) |
| `/custom-template` | Custom-template studio | [`custom-template/page.tsx`](<../servers/nextjs/app/(presentation-generator)/custom-template/page.tsx#L1>) |
| `/pdf-maker?id=...` | Internal PDF render/export page | [`pdf-maker/page.tsx`](<../servers/nextjs/app/(export)/pdf-maker/page.tsx#L1>) |

## Global and shared events

| Step | Mixpanel event | Exact page(s) | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|---|
| 1 | `Page View` | Every route listed above | Once per pathname change after the global initializer runs. Query-string-only changes do not create a new event because the value is based on `usePathname()`. | `url` (pathname only) | [`MixpanelInitializer.tsx:16`](../servers/nextjs/app/MixpanelInitializer.tsx#L16) |
| 2 | `Navigation` | `/`, `/dashboard`, `/upload`, `/documents-preview`, `/outline`, `/presentation`, `/template-preview`; also the shared header while `/custom-template` is loading | When a tracked link/button moves to another internal route, enters presentation mode, or opens the dashboard header's Settings/GitHub/Discord/update destinations. This is not an automatic router event: only the explicit call sites are tracked. | Usually `from`, `to`; dashboard external links also send `source`, and the update link sends `app_version`. | [`FinalStep.tsx:72`](../servers/nextjs/components/OnBoarding/FinalStep.tsx#L72), [`DashboardPage.tsx:146`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/dashboard/components/DashboardPage.tsx#L146>), [`Header.tsx:46`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/dashboard/components/Header.tsx#L46>), [`UploadPage.tsx:379`](<../servers/nextjs/app/(presentation-generator)/upload/components/UploadPage.tsx#L379>), [`DocumentPreviewPage.tsx:172`](<../servers/nextjs/app/(presentation-generator)/documents-preview/components/DocumentPreviewPage.tsx#L172>), [`PresentationHeader.tsx:593`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationHeader.tsx#L593>), [`PresentationPage.tsx:597`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationPage.tsx#L597>), [`ThemeSelector.tsx:56`](<../servers/nextjs/app/(presentation-generator)/presentation/components/ThemeSelector.tsx#L56>) |

### Shared ChatGPT/Codex authentication

The sign-in UI exists on both `/` (onboarding) and `/settings`. The reauthentication helper is additionally used by outline/presentation streaming and shared API error handling.

| Step | Mixpanel event | Exact page(s) | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|---|
| 1 | `Codex Sign In API Call` | `/`, `/settings` | Immediately before initiating browser-based ChatGPT/Codex sign-in. | None | [`CodexConfig.tsx:117`](../servers/nextjs/components/CodexConfig.tsx#L117), [`SettingCodex.tsx:125`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/SettingCodex.tsx#L125>) |
| 2 | `Codex Sign In Completed` | `/`, `/settings` | Browser polling reports success, or the manual code exchange succeeds. | `method` = `browser_poll` or `manual_exchange` | [`CodexConfig.tsx:140`](../servers/nextjs/components/CodexConfig.tsx#L140), [`SettingCodex.tsx:147`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/SettingCodex.tsx#L147>) |
| 3 | `Codex Sign In Failed` | `/`, `/settings` | Initiation, browser polling, or manual exchange fails. | `method`; settings also sends sanitized `error_message` for initiation/manual-exchange failures | [`CodexConfig.tsx:153`](../servers/nextjs/components/CodexConfig.tsx#L153), [`SettingCodex.tsx:162`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/SettingCodex.tsx#L162>) |
| 4 | `Codex Sign In Cancelled` | `/`, `/settings` | The user cancels browser polling. | None | [`CodexConfig.tsx:216`](../servers/nextjs/components/CodexConfig.tsx#L216), [`SettingCodex.tsx:235`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/SettingCodex.tsx#L235>) |
| 5 | `Codex Signed Out` | `/`, `/settings` | ChatGPT/Codex sign-out succeeds. | None | [`CodexConfig.tsx:227`](../servers/nextjs/components/CodexConfig.tsx#L227), [`SettingCodex.tsx:245`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/SettingCodex.tsx#L245>) |
| 6 | `Codex Reauth Required` | `/`, `/settings`, `/outline`, `/presentation`, and any presentation-generator page that reaches the shared API 401/403 handler | The shared helper determines that the ChatGPT/Codex session must be renewed. The event is emitted once per helper invocation before the reauth UI/event is dispatched. | `source` (caller-supplied source or `unknown`) | [`chatgptAuth.ts:91`](../servers/nextjs/utils/chatgptAuth.ts#L91); callers include [`api-error-handler.ts:43`](<../servers/nextjs/app/(presentation-generator)/services/api/api-error-handler.ts#L43>), [`useOutlineStreaming.ts:214`](<../servers/nextjs/app/(presentation-generator)/outline/hooks/useOutlineStreaming.ts#L214>), and [`usePresentationStreaming.ts:417`](<../servers/nextjs/app/(presentation-generator)/presentation/hooks/usePresentationStreaming.ts#L417>) |

## `/` — authentication gate

This branch is rendered when authentication is enabled and the server reports that the user is not yet authenticated.

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Auth Status Checked` | Auth is disabled, a status request returns, or the status request fails. | `configured`, `authenticated`, `auth_disabled`; failure also sends sanitized `error_message` | [`AuthGate.tsx:49`](../servers/nextjs/components/Auth/AuthGate.tsx#L49), [`:111`](../servers/nextjs/components/Auth/AuthGate.tsx#L111), [`:123`](../servers/nextjs/components/Auth/AuthGate.tsx#L123) |
| 2 | `Auth Setup Started` | The first-account setup form is submitted. | `username_length` | [`AuthGate.tsx:170`](../servers/nextjs/components/Auth/AuthGate.tsx#L170) |
| 3 | `Auth Setup Completed` | Account setup returns success. | `username_length` | [`AuthGate.tsx:227`](../servers/nextjs/components/Auth/AuthGate.tsx#L227) |
| 4 | `Auth Setup Failed` | Setup returns a non-success response or throws. | `status_code`, sanitized `error_message` | [`AuthGate.tsx:198`](../servers/nextjs/components/Auth/AuthGate.tsx#L198), [`:259`](../servers/nextjs/components/Auth/AuthGate.tsx#L259) |
| 5 | `Auth Sign In Started` | The existing-account sign-in form is submitted. | `username_length` | [`AuthGate.tsx:170`](../servers/nextjs/components/Auth/AuthGate.tsx#L170) |
| 6 | `Auth Sign In Completed` | Sign-in returns success. | `username_length` | [`AuthGate.tsx:248`](../servers/nextjs/components/Auth/AuthGate.tsx#L248) |
| 7 | `Auth Sign In Failed` | Sign-in returns a non-success response or throws. | `status_code`, sanitized `error_message` | [`AuthGate.tsx:198`](../servers/nextjs/components/Auth/AuthGate.tsx#L198), [`:259`](../servers/nextjs/components/Auth/AuthGate.tsx#L259) |
| 8 | `Auth Signed Out` | The logout request succeeds. The current logout button is mounted on `/settings`. | `source` = `logout_button` | [`LogoutButton.tsx:28`](../servers/nextjs/components/Auth/LogoutButton.tsx#L28) |

## `/` — onboarding flow

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Onboarding Step Viewed` | A provider sub-step becomes active, or the finish step mounts. Duplicate view tracking is guarded by the current step key. | Provider steps: `step_name`, `step_number`, plus step state; finish: `step_name=finish`, `step_number=4` | [`PresentonMode.tsx:972`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L972), [`FinalStep.tsx:32`](../servers/nextjs/components/OnBoarding/FinalStep.tsx#L32) |
| 2 | `Onboarding Text Provider Tab Selected` | The user switches the text-provider group/tab. | `tab`, `previous_tab` | [`PresentonMode.tsx:285`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L285) |
| 3 | `Onboarding Text Provider Selected` | A provider control is changed, or changing tabs selects that tab's default provider. | `provider`, `provider_label`, `provider_group`, `text_provider_tab`, `selection_source` | [`PresentonMode.tsx:86`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L86), [`:290`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L290) |
| 4 | `Onboarding Text Model Selected` | A Codex or standard provider model is selected. | `provider`, `model`, `text_provider_tab` | [`PresentonMode.tsx:1106`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L1106), [`:1520`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L1520) |
| 5 | `Onboarding Image Generation Toggled` | Image generation is enabled or disabled. | `enabled`, `image_step_skipped` | [`PresentonMode.tsx:1573`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L1573) |
| 6 | `Onboarding Image Provider Selected` | An image provider is selected. | `image_provider`, `image_provider_label` | [`PresentonMode.tsx:1615`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L1615) |
| 7 | `Onboarding Image Quality Selected` | DALL-E 3 or GPT Image 1.5 quality is selected. | `image_provider`, `quality` | [`PresentonMode.tsx:445`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L445), [`:479`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L479) |
| 8 | `Onboarding Web Search Toggled` | Web search is enabled or disabled. | `enabled`, `web_search_step_skipped` | [`PresentonMode.tsx:1661`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L1661) |
| 9 | `Onboarding Web Search Provider Selected` | A web-search provider is selected. | `web_search_provider`, `web_search_provider_label` | [`PresentonMode.tsx:1693`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L1693) |
| 10 | `Onboarding Validation Failed` | Text-provider, image-provider, Codex-login, or web-search validation prevents continuation/save. | `step_name`, `validation_error`, plus the relevant provider/enabled/skipped fields | [`PresentonMode.tsx:699`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L699), [`:710`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L710), [`:799`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L799), [`:826`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L826) |
| 11 | `Onboarding Step Continued` | Text → image, image → web search, or web search → finish succeeds. | `from_step`, `to_step`, plus the configuration relevant to the step being left | [`PresentonMode.tsx:767`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L767), [`:813`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L813), [`:836`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L836) |
| 12 | `Onboarding Back Clicked` | The progress header or footer Back control moves to an earlier step. | `from_step_number`/`to_step_number` or `from_step`/`to_step`; `source` | [`OnBoardingHeader.tsx:21`](../servers/nextjs/components/OnBoarding/OnBoardingHeader.tsx#L21), [`PresentonMode.tsx:850`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L850) |
| 13 | `Onboarding Configuration Saved` | The final provider configuration save succeeds. | Text provider/tab; image enabled/skipped/provider; web-search enabled/skipped/provider | [`PresentonMode.tsx:731`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L731) |
| 14 | `Onboarding Providers Models Selected` | The same successful save records a fuller provider/model snapshot. | `pathname`, text provider/label/tab/model/login mode, image enabled/skipped/provider/label/quality, web-search enabled/skipped/provider | [`PresentonMode.tsx:747`](../servers/nextjs/components/OnBoarding/PresentonMode.tsx#L747) |
| 15 | `Onboarding Completed` | The finish step mounts after telemetry preference handling. | None | [`FinalStep.tsx:36`](../servers/nextjs/components/OnBoarding/FinalStep.tsx#L36) |

## `/dashboard`

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Dashboard Page Viewed` | Presentation loading finishes, including an error result. | `pathname`, `presentation_count`, `load_failed` | [`DashboardPage.tsx:329`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/dashboard/components/DashboardPage.tsx#L329>) |
| 2 | `Dashboard New Presentation Clicked` | The user clicks the new-presentation action card or the empty-state CTA. | `pathname` when available; `source` = `dashboard_actions_card` or `dashboard_empty_state` | [`DashboardPage.tsx:366`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/dashboard/components/DashboardPage.tsx#L366>), [`EmptyState.tsx:15`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/dashboard/components/EmptyState.tsx#L15>) |
| 3 | `Dashboard Presentation Opened` | A presentation card is opened. | `pathname`, `presentation_id`, `title_length`, `slide_count` | [`PresentationCard.tsx:92`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/dashboard/components/PresentationCard.tsx#L92>) |
| 4 | `Dashboard Presentation Deleted` | A presentation is successfully deleted. | `pathname`, `presentation_id`, `slide_count` | [`PresentationCard.tsx:112`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/dashboard/components/PresentationCard.tsx#L112>) |
| 5 | `Dashboard Presentation Duplicated` | Duplication succeeds. | `pathname`, original `presentation_id`, `duplicate_presentation_id`, `slide_count` | [`PresentationCard.tsx:133`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/dashboard/components/PresentationCard.tsx#L133>) |

## `/settings`

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Settings Section Entered` | The selected settings section changes/mounts. | `section`, `image_generation_enabled`, `web_search_enabled` | [`SettingPage.tsx:95`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/SettingPage.tsx#L95>) |
| 2 | `Settings Tab Switched` | The user selects a different settings section. | `from_section`, `to_section` | [`SettingPage.tsx:87`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/SettingPage.tsx#L87>) |
| 3 | `Settings Provider Selected` | Text, image, or web-search provider changes; also when image generation or web search is toggled. | `section`, `provider`; toggle calls also send `enabled` | [`TextProvider.tsx:518`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/TextProvider.tsx#L518>), [`ImageProvider.tsx:29`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/ImageProvider.tsx#L29>), [`WebSearchProvider.tsx:70`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/WebSearchProvider.tsx#L70>) |
| 4 | `Settings Model Selected` | A standard-provider or Codex model is selected. | `provider`, `model` | [`TextProvider.tsx:881`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/TextProvider.tsx#L881>), [`SettingCodex.tsx:455`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/SettingCodex.tsx#L455>) |
| 5 | `Settings Save Configuration Button Clicked` | Save is clicked before validation/API work. | `pathname` | [`SettingPage.tsx:161`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/SettingPage.tsx#L161>) |
| 6 | `Settings Save Configuration API Call` | Immediately before the configuration save API request. | None | [`SettingPage.tsx:189`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/settings/SettingPage.tsx#L189>) |

The shared Codex sign-in events and `Auth Signed Out` also fire on this page; they are listed in the shared/auth tables above.

## `/templates`

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Templates Page Viewed` | The template panel mounts. | None | [`TemplatePanel.tsx:33`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/templates/components/TemplatePanel.tsx#L33>) |
| 2 | `Templates Tab Switched` | The inbuilt/custom tab changes. | `tab` | [`TemplatePanel.tsx:60`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/templates/components/TemplatePanel.tsx#L60>) |
| 3 | `Templates Inbuilt Opened` | A default/inbuilt template is opened. | `template_id`, `template_name` | [`TemplatePanel.tsx:45`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/templates/components/TemplatePanel.tsx#L45>) |
| 4 | `Templates Custom Opened` | A custom template is opened. | `template_id`, `template_name` | [`TemplatePanel.tsx:45`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/templates/components/TemplatePanel.tsx#L45>) |
| 5 | `Templates New Template Clicked` | The New Template control is clicked. | None | [`TemplatePanel.tsx:76`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/templates/components/TemplatePanel.tsx#L76>) |
| 6 | `Templates Build Template Clicked` | `/templates`: template-builder CTA. `/custom-template`: preview becomes ready or asynchronous creation begins. | On `/custom-template`: `source`, `slide_count`; none on the gallery CTA | [`CreateCustomTemplate.tsx:11`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/templates/components/CreateCustomTemplate.tsx#L11>), [`CustomTemplatePage.tsx:1631`](<../servers/nextjs/app/(presentation-generator)/custom-template/CustomTemplatePage.tsx#L1631>), [`:1653`](<../servers/nextjs/app/(presentation-generator)/custom-template/CustomTemplatePage.tsx#L1653>) |

## `/theme`

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Theme Page Viewed` | The theme panel mounts. | `pathname` | [`ThemePanel/index.tsx:96`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L96>) |
| 2 | `Theme Tab Switched` | The user switches to custom or default themes. | `pathname`, `tab` | [`ThemePanel/index.tsx:998`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L998>), [`:1010`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L1010>) |
| 3 | `Theme Selected` | A theme is selected from the list. | `pathname`, `theme_id`, `theme_name`, `theme_source` | [`ThemePanel/index.tsx:272`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L272>) |
| 4 | `Theme Editor Opened` | An existing theme is selected for editing, or a new draft is created. | `pathname`, `theme_id`, `theme_name`, `theme_source` | [`ThemePanel/index.tsx:278`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L278>), [`:418`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L418>) |
| 5 | `Theme New Theme Clicked` | Either New Theme entry point is used. | `pathname`; header CTA also sends `source=theme_page_header` | [`ThemePanel/index.tsx:363`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L363>), [`:977`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L977>) |
| 6 | `Theme Font Changed` | A library font is selected or an uploaded font is applied. | `pathname`, `theme_id`, `font_name`, `font_url`; uploaded font also sends `source=uploaded_font` | [`ThemePanel/index.tsx:298`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L298>), [`:555`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L555>) |
| 7 | `Theme Custom Font Uploaded` | A custom font upload succeeds. | `pathname`, `font_name`, `file_name`, `file_size_bytes` | [`ThemePanel/index.tsx:549`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L549>) |
| 8 | `Theme Logo Uploaded` | A brand logo upload succeeds. | `pathname`, `theme_id`, `file_name`, `file_size_bytes` | [`ThemePanel/index.tsx:312`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L312>) |
| 9 | `Theme Palette Generated` | Theme colors are generated from seeds/source. | `pathname`, `source`, `theme_id`, `has_primary_seed`, `has_background_seed` | [`ThemePanel/index.tsx:335`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L335>) |
| 10 | `Theme Save Started` | Save begins in create or update mode. | `pathname`, `mode`, `theme_id`, `theme_name` | [`ThemePanel/index.tsx:435`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L435>), [`:477`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L477>) |
| 11 | `Theme Saved` | Create/update completes successfully. | `pathname`, `mode`, `theme_id`, `theme_name`, `has_logo`, `font_name` | [`ThemePanel/index.tsx:457`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L457>), [`:501`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L501>) |
| 12 | `Theme Deleted` | A custom theme is successfully deleted. | `pathname`, `theme_id` | [`ThemePanel/index.tsx:526`](<../servers/nextjs/app/(presentation-generator)/(dashboard)/theme/components/ThemePanel/index.tsx#L526>) |

## `/upload`

The four upload events reuse a common snapshot: `pathname`, `generation_path`, slide count/mode, language, tone, verbosity, title/TOC/web-search flags, prompt/instruction presence and sizes, attachment count/categories, text provider/model, and image generation/provider/quality.

| Step | Mixpanel event | When it fires | Additional properties | Exact source |
|---:|---|---|---|---|
| 1 | `Upload Configuration Invalid` | Generation is blocked because language/input is missing, Auto language is used with documents, or the configured stock provider cannot be reached. | Common snapshot + `reason` | [`UploadPage.tsx:206`](<../servers/nextjs/app/(presentation-generator)/upload/components/UploadPage.tsx#L206>) |
| 2 | `Upload Generation Started` | Valid configuration is submitted, before stock-provider checking and document/prompt branching. | Common snapshot only | [`UploadPage.tsx:281`](<../servers/nextjs/app/(presentation-generator)/upload/components/UploadPage.tsx#L281>) |
| 3 | `Upload Documents Processed` | Uploaded documents have been uploaded/decomposed and a presentation record has been created. | Common snapshot + `uploaded_documents_count`, `decompose_job_count`, `extracted_document_count`, `destination=/outline` | [`UploadPage.tsx:365`](<../servers/nextjs/app/(presentation-generator)/upload/components/UploadPage.tsx#L365>) |
| 4 | `Upload Outline Generation Requested` | The presentation record is ready and the app is about to navigate to `/outline`; applies to document and prompt-only paths. | Common snapshot + `presentation_id`, `destination`; document path also sends uploaded/extracted counts | [`UploadPage.tsx:372`](<../servers/nextjs/app/(presentation-generator)/upload/components/UploadPage.tsx#L372>), [`:417`](<../servers/nextjs/app/(presentation-generator)/upload/components/UploadPage.tsx#L417>) |

## `/documents-preview`

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Documents Preview Create Presentation API Call` | Immediately before creating a presentation from the selected extracted document paths. | None | [`DocumentPreviewPage.tsx:153`](<../servers/nextjs/app/(presentation-generator)/documents-preview/components/DocumentPreviewPage.tsx#L153>) |

The successful path then emits the shared `Navigation` event to `/outline`.

## `/outline`

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Template V2 Template Selected` | The user selects a custom or default template. | `presentation_id`, `template_id`, `template_source` = `custom` or `default` | [`TemplateSelection.tsx:54`](<../servers/nextjs/app/(presentation-generator)/outline/components/TemplateSelection.tsx#L54>), [`:77`](<../servers/nextjs/app/(presentation-generator)/outline/components/TemplateSelection.tsx#L77>) |
| 2 | `Template V2 Outline Regeneration Started` | Regenerate Outline begins. | `presentation_id`, `template_id`, prompt/document/slide settings, language, tone, verbosity, web-search/title/TOC flags | [`OutlinePage.tsx:223`](<../servers/nextjs/app/(presentation-generator)/outline/components/OutlinePage.tsx#L223>) |
| 3 | `Template V2 Outline Regeneration Completed` | Regeneration creates the replacement presentation successfully. | `old_presentation_id`, `new_presentation_id`, `template_id` | [`OutlinePage.tsx:253`](<../servers/nextjs/app/(presentation-generator)/outline/components/OutlinePage.tsx#L253>) |
| 4 | `Template V2 Outline Regeneration Failed` | Regeneration throws/fails. | `presentation_id`, `template_id`, sanitized `error_message` | [`OutlinePage.tsx:261`](<../servers/nextjs/app/(presentation-generator)/outline/components/OutlinePage.tsx#L261>) |
| 5 | `Outline Presentation Generation Started` | Generate Presentation is submitted after prepared outlines are available. | `pathname`, `presentation_id`, `outline_count`, `template_id` | [`usePresentationGeneration.ts:89`](<../servers/nextjs/app/(presentation-generator)/outline/hooks/usePresentationGeneration.ts#L89>) |
| 6 | `Template V2 Prepare Completed` | The prepare-presentation API succeeds. | `presentation_id`, `template_id`, `outline_count` | [`usePresentationGeneration.ts:119`](<../servers/nextjs/app/(presentation-generator)/outline/hooks/usePresentationGeneration.ts#L119>) |
| 7 | `Template V2 Prepare Failed` | The prepare-presentation flow throws/fails. | `presentation_id`, `template_id`, `outline_count`, sanitized `error_message` | [`usePresentationGeneration.ts:134`](<../servers/nextjs/app/(presentation-generator)/outline/hooks/usePresentationGeneration.ts#L134>) |

### AI assistant on `/outline` and `/presentation`

The same `Chat` component runs with different `variant` values. Every event below includes common properties `variant`, `presentation_id`, `resource_id`, and `conversation_scope`.

| Step | Mixpanel event | When it fires | Additional properties | Exact source |
|---:|---|---|---|---|
| 1 | `AI Assistant Opened` | A chat instance becomes active for a resource; guarded by `variant:resource_id` to avoid duplicate open events. | Common properties only | [`Chat.tsx:1228`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L1228>) |
| 2 | `AI Assistant Attachment Added` | File processing succeeds or pasted images upload successfully. | `source`, `image_count`, `document_count`, `total_count` | [`Chat.tsx:1987`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L1987>), [`:2567`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L2567>) |
| 3 | `AI Assistant Attachment Failed` | File upload, image OCR, or pasted-image upload fails. | `source`, `file_count`, sanitized `error_message` | [`Chat.tsx:1995`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L1995>), [`:2087`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L2087>), [`:2579`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L2579>) |
| 4 | `AI Assistant Prompt Submitted` | A chat request is about to be sent. | Text/length bucket, image/document/link counts, selected-slide and selected-template-target flags | [`Chat.tsx:2155`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L2155>) |
| 5 | `AI Assistant Prompt Completed` | The assistant request succeeds. | Conversation presence, `duration_ms`, mutating/read tool counts, unique tools, mutated-slide count, attachment/link counts | [`Chat.tsx:2324`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L2324>) |
| 6 | `AI Assistant Prompt Stopped` | The request ends with an abort error (user stop/cancellation). | `duration_ms` | [`Chat.tsx:2349`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L2349>) |
| 7 | `AI Assistant Prompt Failed` | The assistant request fails for a non-abort reason. | `duration_ms`, sanitized `error_message`, mutating tool count, unique tools | [`Chat.tsx:2375`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L2375>) |
| 8 | `AI Assistant Chat Reset` | The user resets the chat and its saved conversation. | `delete_saved_conversation=true` | [`Chat.tsx:1677`](<../servers/nextjs/app/(presentation-generator)/presentation/components/Chat.tsx#L1677>) |

## `/presentation?id=...` — generation, editor, and export

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Presentation Editor Viewed` | The presentation data is available in edit or presentation mode. | `pathname`, `presentation_id`, `stream_mode`, `presentation_mode` | [`PresentationPage.tsx:301`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationPage.tsx#L301>) |
| 2 | `Template V2 Editor Loaded` | A Template V2 presentation finishes loading; guarded by a per-presentation analytics key. | `presentation_id`, `slide_count`, `stream_mode`, `template_id_candidates` | [`PresentationPage.tsx:317`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationPage.tsx#L317>) |
| 3 | `Presentation Stream API Call` | The presentation streaming request is started. | None | [`usePresentationStreaming.ts:453`](<../servers/nextjs/app/(presentation-generator)/presentation/hooks/usePresentationStreaming.ts#L453>) |
| 4 | `Template V2 Stream Completed` | Streaming reaches successful completion. | `presentation_id`, `slide_count`, `retry_count`, `duration_ms` | [`usePresentationStreaming.ts:236`](<../servers/nextjs/app/(presentation-generator)/presentation/hooks/usePresentationStreaming.ts#L236>) |
| 5 | `Template V2 Stream Failed` | Streaming fails after its retry handling. | `presentation_id`, `retry_count`, `duration_ms`, sanitized `error_message` | [`usePresentationStreaming.ts:144`](<../servers/nextjs/app/(presentation-generator)/presentation/hooks/usePresentationStreaming.ts#L144>) |
| 6 | `Presentation Title Updated` | A changed title is committed. | `pathname`, `presentation_id`, `previous_title_length`, `next_title_length` | [`PresentationHeader.tsx:162`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationHeader.tsx#L162>) |
| 7 | `Presentation Slide Added` | A layout is inserted, a blank slide is added, or the current slide is duplicated. | `pathname`, `presentation_id`, insertion index; depending on path: template/layout IDs, source, slide metadata, custom/V2 flags | [`NewSlide.tsx:225`](<../servers/nextjs/app/(presentation-generator)/presentation/components/NewSlide.tsx#L225>), [`SlideActionBar.tsx:150`](<../servers/nextjs/app/(presentation-generator)/presentation/components/SlideActionBar.tsx#L150>), [`:177`](<../servers/nextjs/app/(presentation-generator)/presentation/components/SlideActionBar.tsx#L177>) |
| 8 | `Presentation Slides Reordered` | Thumbnail drag/drop or the slide action bar moves a slide. | `pathname`, `presentation_id`, `from_index`, `to_index`, `slide_count`; action bar adds `source=action_bar` | [`SidePanel.tsx:118`](<../servers/nextjs/app/(presentation-generator)/presentation/components/SidePanel.tsx#L118>), [`SlideActionBar.tsx:196`](<../servers/nextjs/app/(presentation-generator)/presentation/components/SlideActionBar.tsx#L196>) |
| 9 | `Presentation Slide Deleted` | A slide delete succeeds, including the blank-fallback branch. | `pathname`, `presentation_id`, `slide_id`, `slide_index`, `layout`; fallback adds `blank_fallback`, `fallback_slide_id` | [`SlideActionBar.tsx:220`](<../servers/nextjs/app/(presentation-generator)/presentation/components/SlideActionBar.tsx#L220>), [`:236`](<../servers/nextjs/app/(presentation-generator)/presentation/components/SlideActionBar.tsx#L236>) |
| 10 | `Presentation Theme Changed` | A built-in or custom theme is applied. | `pathname`, `theme_id`, `theme_name`, `theme_source` | [`ThemeSelector.tsx:30`](<../servers/nextjs/app/(presentation-generator)/presentation/components/ThemeSelector.tsx#L30>) |
| 11 | `Presentation Theme Reset` | The current theme override is reset. | `pathname` | [`ThemeSelector.tsx:42`](<../servers/nextjs/app/(presentation-generator)/presentation/components/ThemeSelector.tsx#L42>) |
| 12 | `Presentation Export Started` | PPTX or PDF export begins. | `pathname`, `presentation_id`, `format`, `slide_count` | [`PresentationHeader.tsx:222`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationHeader.tsx#L222>), [`:310`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationHeader.tsx#L310>) |
| 13 | `Presentation Export Completed` | PPTX or PDF export succeeds. | Start fields + `duration_ms`, `export_runtime`, `is_template_v2` | [`PresentationHeader.tsx:270`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationHeader.tsx#L270>), [`:354`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationHeader.tsx#L354>) |
| 14 | `Presentation Export Failed` | PPTX or PDF export throws/fails. | Completion fields + sanitized `error_message` | [`PresentationHeader.tsx:281`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationHeader.tsx#L281>), [`:365`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationHeader.tsx#L365>) |
| 15 | `Presentation Regenerated` | Regenerate is clicked before the app returns to the outline flow. | `pathname`, `presentation_id`, `slide_count` | [`PresentationHeader.tsx:388`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationHeader.tsx#L388>) |
| 16 | `Presentation Mode Entered` | Present is clicked before navigating to `mode=present`. | `pathname`, `presentation_id`, `slide_index`, `slide_count` | [`PresentationHeader.tsx:587`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationHeader.tsx#L587>) |
| 17 | `Presentation Page Refresh Page Button Clicked` | The editor error state’s Refresh Page button is clicked. | `pathname` | [`PresentationPage.tsx:586`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationPage.tsx#L586>) |

### `/presentation?id=...` — Template V2 editing actions

Surface events share `presentation_id` and `slide_index`. Insert/panel events send their own presentation and slide context as shown.

| Step | Mixpanel event | When it fires | Additional properties | Exact source |
|---:|---|---|---|---|
| 1 | `Editor Template Blocks Loaded` | Template blocks are read from cache or fetched successfully. | `presentation_id`, `block_group_count`, `from_cache` | [`PresentationActions.tsx:878`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationActions.tsx#L878>), [`:894`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationActions.tsx#L894>) |
| 2 | `Editor Template Blocks Load Failed` | Fetching template blocks fails. | `presentation_id`, `error_message` | [`PresentationActions.tsx:906`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationActions.tsx#L906>) |
| 3 | `Editor Side Panel Tab Selected` | The editor action tab changes. | `presentation_id`, `tab`, `variant=template-v2` | [`PresentationActions.tsx:1463`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationActions.tsx#L1463>) |
| 4 | `Editor Insert Palette Item Selected` | A text, chart, table, image, or generic element palette item is selected. | `presentation_id`, `category`, `item_id`, `item_label`, `slide_index` | [`PresentationActions.tsx:1362`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationActions.tsx#L1362>) |
| 5 | `Editor Template Block Inserted` | A normal or fallback template block is inserted. | `presentation_id`, `block_title`, `block_index`, `element_count`, `slide_index` | [`PresentationActions.tsx:1431`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationActions.tsx#L1431>), [`:1452`](<../servers/nextjs/app/(presentation-generator)/presentation/components/PresentationActions.tsx#L1452>) |
| 6 | `Editor Element Text Edited` | An inline edit closes and the text actually changed. | Shared surface fields + `element_type`, `target_kind` | [`TemplateV2KonvaSlide.tsx:1287`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1287) |
| 7 | `Editor Element Style Changed` | An element/layout/chart/table/component-element toolbar applies a style change. | Shared fields + `element_type`, `change_source` | [`TemplateV2KonvaSlide.tsx:1334`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1334), [`:1378`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1378), [`:1441`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1441), [`:1465`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1465), [`:1489`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1489) |
| 8 | `Editor Element Deleted` | A component or current element/component selection is deleted. | Shared fields + `target_kind`, `element_type` | [`TemplateV2KonvaSlide.tsx:1059`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1059), [`:1087`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1087) |
| 9 | `Editor Element Duplicated` | A component or current selection is duplicated. | Shared fields + `target_kind` | [`TemplateV2KonvaSlide.tsx:1151`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1151), [`:1172`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1172) |
| 10 | `Editor Component Ungrouped` | A selected component is successfully ungrouped. | Shared surface fields | [`TemplateV2KonvaSlide.tsx:1517`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1517) |
| 11 | `Editor Component Layer Changed` | A component layer reorder action succeeds. | Shared fields + `action` | [`TemplateV2KonvaSlide.tsx:1558`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1558) |
| 12 | `Editor Icon Replaced` | A selected icon is replaced. | Shared fields + `query_present` | [`TemplateV2KonvaSlide.tsx:1690`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1690) |
| 13 | `Editor Image Replaced` | A valid image upload succeeds and replaces the selected image. | Shared fields + `file_size_bucket` | [`TemplateV2KonvaSlide.tsx:1749`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1749) |
| 14 | `Editor Image Replace Failed` | File type is invalid, file is larger than 5 MB, or upload fails. | Shared fields + `error_message`; oversize/upload branches may include `file_size_bucket` | [`TemplateV2KonvaSlide.tsx:1720`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1720), [`:1729`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1729), [`:1756`](../servers/nextjs/components/slide-editor/surface/TemplateV2KonvaSlide.tsx#L1756) |

## `/template-preview?templateV2Id=...`

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Template Preview Not Found` | The URL has no template ID, or loading returns no template. | `template_id` (`null` or requested ID) | [`TemplatePreviewClient.tsx:269`](<../servers/nextjs/app/(presentation-generator)/template-preview/components/TemplatePreviewClient.tsx#L269>), [`:288`](<../servers/nextjs/app/(presentation-generator)/template-preview/components/TemplatePreviewClient.tsx#L288>) |
| 2 | `Template Preview Failed` | Template loading throws/fails. | `template_id`, sanitized `error_message` | [`TemplatePreviewClient.tsx:278`](<../servers/nextjs/app/(presentation-generator)/template-preview/components/TemplatePreviewClient.tsx#L278>) |
| 3 | `Template Preview Loaded` | A Template V2 preview loads successfully. | `template_id`, `template_version=v2`, `layout_count` | [`TemplatePreviewClient.tsx:296`](<../servers/nextjs/app/(presentation-generator)/template-preview/components/TemplatePreviewClient.tsx#L296>) |
| 4 | `Template Preview Delete Templates Button Clicked` | The delete control is confirmed/clicked. | `pathname` | [`TemplatePreviewClient.tsx:113`](<../servers/nextjs/app/(presentation-generator)/template-preview/components/TemplatePreviewClient.tsx#L113>) |
| 5 | `Template Preview Delete Templates API Call` | Immediately before the delete API request. | None | [`TemplatePreviewClient.tsx:117`](<../servers/nextjs/app/(presentation-generator)/template-preview/components/TemplatePreviewClient.tsx#L117>) |

## `/custom-template`

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `Custom Template Creation Started` | PPTX font checking starts, V2 generation/retry begins, or V1 template initialization succeeds and generation starts. | `source`; depending on phase: file metadata, template/retry IDs, total slides, uploaded-font count | [`useTemplateCreation.ts:152`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L152>), [`:488`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L488>), [`:991`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L991>) |
| 2 | `Custom Template Font Check Completed` | PPTX font analysis succeeds. | `file_size_bucket`, `file_extension`, available/unavailable font counts | [`useTemplateCreation.ts:177`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L177>) |
| 3 | `Custom Template Font Check Failed` | PPTX font analysis fails. | `file_size_bucket`, `file_extension`, sanitized `error_message` | [`useTemplateCreation.ts:188`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L188>) |
| 4 | `Custom Template Preview Started` | Font upload/selection is complete and document preparation begins. | Uploaded/missing/Google-font counts | [`useTemplateCreation.ts:278`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L278>) |
| 5 | `Custom Template Preview Completed` | Preview preparation succeeds. | `slide_count`, uploaded/Google-font counts, `duration_ms` | [`useTemplateCreation.ts:320`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L320>) |
| 6 | `Custom Template Preview Failed` | Preview/document preparation fails. | `uploaded_font_count`, `duration_ms`, sanitized `error_message` | [`useTemplateCreation.ts:332`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L332>) |
| 7 | `Custom Template Slide Generation Started` | A V1/V2 slide layout starts, including automatic retry. | `template_id`, `template_version`, `slide_index`, `auto_retry` | [`useTemplateCreation.ts:539`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L539>), [`:742`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L742>), [`:1066`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L1066>) |
| 8 | `Custom Template Slide Generation Completed` | A V1/V2 slide layout finishes successfully. | `template_id`, `template_version`, `slide_index`, `duration_ms` | [`useTemplateCreation.ts:563`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L563>), [`:864`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L864>), [`:1092`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L1092>) |
| 9 | `Custom Template Slide Generation Failed` | A V1/V2 slide layout fails. | Completion fields + sanitized `error_message` | [`useTemplateCreation.ts:593`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L593>), [`:881`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L881>), [`:1118`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L1118>) |
| 10 | `Custom Template Blocks Generation Completed` | V2 reusable block generation succeeds after slide generation. | `template_id`, `template_version=v2` | [`useTemplateCreation.ts:645`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L645>) |
| 11 | `Custom Template Blocks Generation Failed` | V2 reusable block generation fails. | `template_id`, `template_version=v2`, sanitized `error_message` | [`useTemplateCreation.ts:654`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L654>) |
| 12 | `Custom Template Creation Completed` | V2 generation completes, or all V1 slide layouts reach the completed aggregate state. | `template_id`, optional `template_version`, `total_slides`, `processed_slides`, `failed_slides` | [`useTemplateCreation.ts:670`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L670>), [`:836`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L836>) |
| 13 | `Custom Template Generation Failed` | V2 creation or V1 initialization fails. Note: the enum member is named `CustomTemplate_Creation_Failed`, but its Mixpanel string is **Custom Template Generation Failed**. | `template_id`, `template_version`, `step`, `slide_index`, `duration_ms`, sanitized `error_message` | [`useTemplateCreation.ts:699`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L699>), [`:1011`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useTemplateCreation.ts#L1011>) |
| 14 | `Custom Template Save Modal Opened` | The layout-save modal opens. | `slide_count`, `processed_slides` | [`useLayoutSaving.ts:20`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useLayoutSaving.ts#L20>) |
| 15 | `Custom Template Save Started` | Saving a named layout begins. | `template_info_id`, layout name and its length, description length, slide/processed counts | [`useLayoutSaving.ts:43`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useLayoutSaving.ts#L43>) |
| 16 | `Custom Template Saved` | The layout save API succeeds. | `template_info_id`, `saved_template_id`, `layout_name`, `slide_count` | [`useLayoutSaving.ts:104`](<../servers/nextjs/app/(presentation-generator)/custom-template/hooks/useLayoutSaving.ts#L104>) |

`Templates Build Template Clicked` also has two active call sites on this page and is documented in the `/templates` table because it is the same Mixpanel event name.

## `/pdf-maker?id=...`

| Step | Mixpanel event | When it fires | Properties sent | Exact source |
|---:|---|---|---|---|
| 1 | `PDF Maker Retry Button Clicked` | The internal PDF maker is in its load error state and Retry is clicked before reloading the page. | `pathname` | [`PdfMakerPage.tsx:239`](<../servers/nextjs/app/(export)/pdf-maker/PdfMakerPage.tsx#L239>) |

## Maintenance checklist

When tracking changes, keep this document current in this order:

1. Add or rename the enum entry in `utils/mixpanel.ts`.
2. Add the `trackEvent(...)` call at the real user action/result boundary.
3. Confirm the component is reachable from a current page; a call inside an unimported component is not a live event.
4. Document the exact route, firing condition, complete property set, and source line here.
5. Recheck telemetry opt-out behavior and avoid sending raw prompt/document contents, secrets, or unsanitized errors.
