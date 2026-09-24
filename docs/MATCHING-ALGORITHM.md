# Matching Algorithm — Explainable Rule-Based Matching (NOT ML)

## Inputs
- Student request: `domain`, `goal_type`, `language`, `freeDays` (query param, default 1,3,5)
- Alumni: `expertise_tags[]`, `languages[]`, `slots[{day_of_week}]`, `years_exp`, `max_mentees`, live `active` count

## Formula
```
domain = jaccard(request.domainInterests, alum.expertise_tags)      # 0.40
goal   = 1.0 if goal in alum.goals_supported else 0.6 if goal word in tags else 0.3  # 0.25
lang   = 1 if request.language in alum.languages else 0             # 0.15
avail  = |freeDays ∩ alumDays| / |freeDays|                         # 0.20
raw    = .40·domain + .25·goal + .15·lang + .20·avail
load   = active / max_mentees
penalty = .30 · min(load, 1)
score  = full ? 0 : round(raw · (1 − penalty) · 100, 2)
```

## Capacity handling
`full = active ≥ max_mentees` → score 0, status suggestion `waitlisted`, reason `FULL n/m — auto-waitlisted`. Backend re-checks `mentor_sec.fn_capacity_ok` at request AND accept time (race-safe as practical without serializable txn).

## Tie-breaking
Higher score first; ties keep DB order (alumni creation order). Top-5 returned.

## Missing-data handling
Non-array tags/languages/slots coerce to `[]`; bad caps/counts coerce (cap 1–100 default 5); hostile input never throws (tested).

## Worked example
Request DevOps/placement/English/free Mon,Wed. Alumni A tags [DevOps,Docker], English, slots Mon+Wed, load 2/5:
domain=1.0 (only DevOps overlaps → Jaccard over {DevOps} vs {DevOps,Docker} = 0.5 — see limitation), goal=0.6, lang=1, avail=1.0 → raw=.40·.5+.25·.6+.15·1+.20·1=.70; penalty=.3·.4=.12 → score=61.6 + reasons.

## Limitations / fairness
- Jaccard punishes broad tag lists; mentors with many tags score lower per-tag. Mitigation: keep tags ≤5, specific.
- Goal match is heuristic (no goals_supported column yet — falls back to tag-word match).
- No ML, no training data, no hidden model: every number on the card is recomputable from the payload.
- Synthetic seed is small (12 alumni); rare domains/Languages legitimately score low — shown honestly, not hidden.
