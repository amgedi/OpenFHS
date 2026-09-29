# OpenFHS Data Specification v0.1 — draft

Status: proposed logical data contract for collaborator review. No clinical validation or executable schema is implied. Dates use ISO 8601. Field names below are proposed stable export names.

## 1. Shared record rules

Every record has an opaque `id`, `schema_version`, `created_at`, `created_by`, and revision history. Cat-linked records have `animal_id`. Store event time separately from entry time. Corrections preserve author, timestamp, reason, and prior revision within the retention policy; withdrawal/deletion must also cover revision copies.

Use UTC instants for system timestamps. Preserve event local time, UTC offset, and IANA timezone when known. Historical date-only or approximate dates must remain approximate; do not invent midnight or a birth date from an estimated age. Record `time_precision` and `time_basis` (clock, estimate, recollection, video) with uncertain event times. Unknown timezone is explicit.

Quantities carry value, unit, and measurement/estimation basis. Missing quantities carry a `missing_reason`: `unknown`, `not_observed`, `not_asked`, `not_applicable`, or `declined`. Never substitute zero for missing. In exports, emit separate value and missing-reason columns. A present value and missing reason cannot coexist.

### Behavior responses

| Code | Meaning |
|---|---|
| `yes` | Observer saw the behavior within the stated observation window. |
| `no` | Observer watched the relevant window and reports it did not occur. |
| `unknown` | Observer cannot determine the answer, including an unclear view. |
| `not_observed` | Relevant body area or interval was not watched. |

An unanswered question is `not_answered` at the form/export layer; it is never silently converted to `no` or `unknown`. Questions omitted by a form version are `not_asked`. Preserve partial observation of the episode so a `no` cannot be interpreted as covering unseen portions.

### Provenance

Attach provenance to individual observations or assertions; a record-level default is allowed with field-level overrides. Separate:

- `reporter_role`: owner/caregiver, veterinarian, specialist, researcher, other.
- `evidence_type`: direct observation, medical record, video, sensor, historical recollection.
- `source_ref`: private reference to supporting evidence where available.
- `observed_at` or observation interval, `reported_at`, and `verification_status`: unverified or reviewed with reviewer/time.

An owner reporting what a vet said is still owner-reported; it is not a verified veterinary record. Video annotation has a human annotator and video evidence. Multiple sources can coexist without replacing contradictory claims.

## 2. Minimum logical records

| Record | Initial fields and meaning |
|---|---|
| Animal | `animal_id`, pseudonymous `household_id`, species, reported breed, sex, neuter status, birth date or age estimate with reference date and precision. Unknown is allowed. |
| Baseline | Animal, completion/effective dates, indoor/outdoor lifestyle, current health concerns, history by neurological/skin/pain-behavior categories, current diet, medications/supplements/flea prevention. Each section distinguishes absent history from unknown history. Version the questionnaire. |
| Measurement | Animal, measure code, value/unit, measured time, source; weight uses kg. Repeat measurements instead of overwriting them. |
| Episode | Animal, module `openfhs`, event time/precision, duration and basis, observed portion, preceding activity, behavior responses, body location, context, recovery, video availability, reporter/source, entry time. |
| Daily report | Animal, local date/timezone, reporting caregiver, coverage, count status, observed episode count if known, count precision, detail completeness, entry time. |
| Clinical assessment | Animal, assessed date, condition term, status (suspected, assessed, ruled out, uncertain), author role, evidence source, supporting test references. Wording is reviewable and does not assert a universal FHS diagnostic standard. |
| Cohort membership | Animal, study/cohort ID, rule version, effective dates, assigned by, evidence references. Multiple memberships are possible. |
| Context event | Animal/household, date/precision, event type and factual description: move, new pet, diet change, routine change, other. Owner-suspected association is separate. |
| Intervention | Animal, type, start/end time and precision, intended purpose as reported, source. Supports environmental and dietary changes as well as medication. |

Identity/contact and consent records are separate from research records; see [privacy](privacy.md). Baseline history is a summary, not a substitute for dated assessments or medication timelines. Retain versions of changed baseline answers.

## 3. Episode vocabulary

Candidate observations: visible skin rippling; tail movement; chasing tail; grooming; licking; biting body; scratching; vocalization; visible pupil change; running; sudden jump/flinch; hiss/growl/swipe/bite directed toward another animal/person; urine/stool passage; visible injury.

These require short, researcher-reviewed definitions and examples before use. Split compound questions where answers could differ. Record body site and sequence when known. Avoid owner judgments such as “aggression” or “pain” as substitutes for visible behavior.

For responsiveness, record the naturally occurring cue and response, whether assessable, and observation window. Do not instruct owners to touch, startle, or test the cat. Recovery is the observed return to a described prior activity/state, with duration or missing reason; it is not proof of neurological recovery.

Duration is nonnegative seconds with `duration_basis` (timed, estimated, video) and optional bounds. Incomplete onset/end observation means full duration is unknown or bounded, not equal to the visible clip length. No arbitrary duration limit should silently discard unusual records. Distinct episode boundaries and interrupted/repeated bouts remain a pilot review question; preserve descriptions rather than imposing an unsupported cutoff.

Record context as facts (“vacuum running”) separately from suspected triggers (“owner suspects vacuum”). Video availability is a response state; it does not authorize upload or research use.

Do not introduce an unvalidated composite severity score. Retain observable injury and duration separately. Any owner-perceived intensity or quality-of-life rating must retain its question wording, anchors, instrument version, and subjective status.

## 4. Daily observation and zero-event reporting

Prompt: “How many episodes did you observe today?” Coverage: none, intermittent, or continuous for stated intervals. Collect approximate time with the cat when feasible, separately from active observation time. Being home does not mean watching continuously.

`count_status`: `known`, `unknown`, or `not_observed`. If known, `observed_episode_count` is an integer >= 0 with `count_precision` exact/estimated. A known zero means **zero observed during reported coverage**, never proof that no event occurred in the entire day.

No submitted report means missing reporting. It must not produce a zero. A report with no observation coverage uses `not_observed` and no count. Missing observation time must not be imputed as 24 hours.

Daily totals and episode entries overlap: never add them. Include `details_complete` and reconcile counts, but allow a known count larger than the number of detailed entries. Flag conflicts for correction without erasing either assertion. Multiple caregivers' counts may overlap; do not sum them automatically. Link suspected duplicate episodes for review while preserving both accounts.

Synthetic examples:

| Date | Coverage | Count | Meaning |
|---|---|---|---|
| 2026-09-20 | Intermittent | Known: 0 | No episodes observed during intermittent contact. |
| 2026-09-21 | No report | Missing | No knowledge about reporting or episodes. |
| 2026-09-22 | None | Not observed | Caregiver submitted a report but did not observe the cat. |
| 2026-09-23 | Intermittent | Known: 3, estimated | Three estimated observations; only one may have detailed notes. |

## 5. Medication and outcomes: preserve expansion paths

Separate a medication regimen (intended schedule) from administration (what was actually given). Proposed regimen fields: substance/product, formulation, strength/concentration and units, amount/dose and units, route, frequency, start/end, prescribing/source information, reason stopped. Administration adds actual time, actual amount, missed/unknown status, and reported effects. “No entry” does not mean a missed dose.

Any research-derived mg/kg requires compatible dose units and a dated weight, and retains calculation inputs and method. Do not calculate from volume alone without concentration. It is not dosing advice. Initially record reported regimens without building a dose calculator.

Outcomes may include observed episode count, observed duration, injury, activity, appetite, sleep, grooming, hiding, play, sociability, owner quality of life, and veterinary assessment. Each needs a reference interval, source, missingness, and instrument version. Validated questionnaires require suitability and reuse-permission checks. Decide primary pilot outcomes before collecting a large battery of questions.

## 6. Later records

Vet visits, diagnostic tests, imaging, laboratory results with original units/reference intervals, medical documents, sensor readings, and media become explicit records as use cases require. Do not implement every future table now.

Video annotations will link immutable media version, annotator, vocabulary version, start/end offsets, label, and uncertainty. Each rater's annotations remain separate; consensus annotations must not overwrite originals. Agreement statistics must suit the annotation task and be chosen with a statistician. Clip absence cannot prove absence outside the recorded interval.

## 7. Export and validation contract

Export a versioned JSON package and separate CSV tables keyed by IDs. Include dictionary, form/schema versions, export time, eligibility policy version, and explicit missing codes. Protect free text and precise timestamps according to export approval. Exclude contact information and raw media by default.

Minimum acceptance cases for the implementation:

1. Yes/no/unknown/not-observed/unanswered survive a save/export cycle unchanged.
2. A missing daily report never becomes zero; daily totals are not added to episode details.
3. Unknown onset, estimated duration, date-only dates, and DST offsets remain distinguishable.
4. Every reference resolves; revisions retain provenance; conflicting observations remain visible.
5. Negative duration/weight and incompatible units are rejected; unusual valid values invite review without silent deletion.
6. A withdrawn or nonconsenting record cannot enter a new research export; approved scope is enforced per record and media asset.
7. Removing a research identifier does not cause identifiable free text to enter a public export.

Clinical vocabulary, episode boundaries, required-question burden, and cohort rules remain provisional. Freeze an implementable schema after review and synthetic walkthroughs.
