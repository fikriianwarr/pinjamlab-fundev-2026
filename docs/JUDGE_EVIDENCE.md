# PinjamLab — judge evidence map

**Application 2.0.0 · KEBAS · Universitas Mikroskil, Indonesia**  
Evidence map reviewed on **22 October 2026**. Weights follow the official FunDev judging page. These are criterion weights, not self-awarded scores.

[Project README](../README.md) · [Complete test output](test-results.txt) · [Impact protocol](VALIDATION_AND_IMPACT.md) · [English-captioned video](https://drive.google.com/file/d/186kJ-KZZsEFrTM5ohyM9NTE-4W9wUyE7/view?pli=1)

## A two-minute review path

1. Read the README's contribution table and the actual planner capture.
2. Follow request → approval → collection → condition return → inspection release in the video or runnable app.
3. Inspect the concurrent-approval and maintenance tests together with the measured 40-test report.
4. Read the impact protocol's measurement definitions and inventory-granularity boundary.

The video is 3:30. The fourteen-slide deck and ten-minute pitch notes are supplied in the full submission package; this public repository contains runnable source and documentation.

## Innovation & Creativity — 25%

**Contribution to inspect:** planning, explainable review, allocation and equipment care remain connected through the same records. The contribution is the operational connection and its rules; no first-in-the-world claim is made.

| Claim | Where to inspect | How to check it |
|---|---|---|
| Learners can plan across seven dates | [Planner capture](screenshots/planner.jpg); [server routes](../server.mjs); [browser controls](../public/app.js) | Open Availability planner, filter a category and select an available day. |
| Staff can inspect the review reason | Borrowing desk; server bootstrap/queue data | Review the completed-loan count for the previous 30 days and request ordering. |
| Returning a loan and releasing equipment are separate | [Care capture](screenshots/care.jpg); return and maintenance routes | Return with an issue, observe the held quantity, then record inspection release. |

**Media pointers:** slides 4, 6, 7 and 8; video 00:30–00:45 and 01:15–02:30. The queue is a staff review aid; its real fairness effects remain a pilot question.

## Functionality & Technical Quality — 25%

**Measured baseline:** 40 tests passed, zero failed, zero skipped, Node.js v24.19.0 on 21 October 2026. This documentation revision retains those runtime and test source bytes.

| Property | Exact evidence | Expected behavior |
|---|---|---|
| Competing approvals | [Application tests](../tests/application.test.mjs), `parallel approvals cannot overbook the final unit` | One final-unit approval succeeds; the competing approval conflicts. |
| Safe condition return | Same file, `a damaged return requires a note and creates a maintenance hold atomically` | The returned loan and affected held quantity commit together. |
| No duplicate capacity release | Same file, `repair completion returns inventory and cannot be applied twice` | A second release cannot add stock again. |
| Planner privacy | Same file, `weekly planner matches daily inventory and exposes aggregate counts without borrower records` | The signed-in aggregate response matches daily inventory and omits borrower records. |
| Interval correctness | [Domain tests](../tests/domain.test.mjs) | Adjacent/non-overlapping bookings use the intended exclusive boundary and peak occupancy. |
| Deployment setup and data durability | [Production tests](../tests/production.test.mjs) | Sample access restrictions, bootstrap, consistent backup and date-boundary behavior are exercised. |

Run `npm test` for the complete suite and `npm run check` for syntax checks. The measured results are in [test-results.txt](test-results.txt). Run from the application/repository folder; the suite manages isolated test databases.

**Media pointers:** slides 5–10 and 12; video 01:30–01:45 and 02:45–03:00. The checked runtime is native Node. A broader deployment still needs operational, identity and capacity validation.

## Impact & Relevance — 20%

| Intended pathway | Available evidence | Measurement still required |
|---|---|---|
| SDG 4.3: practical-learning access | Discovery, requests, decisions and recorded handovers | Task completion, suitable handovers and barriers observed in a supervised pilot |
| SDG 12.2: efficient use of existing stock | Inventory and borrowing records | Actual use with an available-time denominator, plus procurement evidence for purchase claims |
| SDG 12.5: care and further use | Quantity holds, resolutions and type-level care history | A separately identified unit log if claiming reuse of the exact repaired device; disposal evidence before claiming waste avoided |

[schema.sql](../schema.sql) stores equipment types and quantities, not individual-unit serials. A later loan with the same asset_id establishes later borrowing from that type. It does not alone prove that the repaired physical device was borrowed again.

The [pilot protocol](VALIDATION_AND_IMPACT.md) defines a planned 6–10-student/1–2-staff study, consent, equivalent task order, assistance/failure reporting and measurement definitions. No pilot results, campus adoption, environmental savings or international deployment are claimed. Portability requires local review of language, dates, access policy, identity and capacity.

**Media pointers:** slides 11 and 13; video 03:00–03:30.

## Video & Documentation Quality — 15%

The English-captioned demo is H.264, 1920×1080, 24 fps, 210 seconds, with 42 burned caption cues. It uses edited actual application captures and explanatory graphics. The full package records crop provenance, media checks, the poster, PDF/PPTX, fonts and exact portal choices.

This README provides setup, sample accounts, the judge walkthrough, feature boundaries, linked tests, impact methods, architecture, API/operations and attribution. The [capture notes](screenshots/README.md) distinguish illustrative state from field results. There is no fabricated continuous screen recording, survey, endorsement or pilot result.

## Presentation & Q&A — 15%

The full package's `PinjamLab_English_Pitch_Notes.md` follows fourteen slides across ten minutes. `FINAL_REHEARSAL_ID.md` proposes speaker handovers and practice checks, while `JUDGE_QA_EN.md` provides concise answers with evidence pointers.

The team should be able to explain the approval transaction, date convention, queue rule, maintenance quantity, individual-unit limitation and impact measurements. Presentation rehearsal is a participant task; no completed rehearsal is asserted in the package. The final uses the exact submitted deck and English delivery, followed by five minutes of Q&A.

## Sources and traceability

- https://fundev.vokasi-usu.id/judging-criteria
- https://fundev.vokasi-usu.id/submission-guide
- https://fundev.vokasi-usu.id/final-presentation
- https://sdgs.un.org/goals/goal4
- https://sdgs.un.org/goals/goal12

The full package's QA report and verification records identify the source-tree comparison and media checks. A complete evidence map supports review; it does not predict the judges' scores or ranking.
