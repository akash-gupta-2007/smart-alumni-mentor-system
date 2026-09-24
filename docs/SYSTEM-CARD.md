# System Card — MentorSetu matching system

- Purpose: rank alumni mentors for a student request with transparent reasons and capacity safety.
- Inputs: domain, goal, language, free days; alumni tags, languages, slots, experience, cap + live load.
- Outputs: Top-5 with score 0–100, weight breakdown, human reasons, full/waitlist flag.
- Method: rule-based weighted sum (40/25/15/20) minus load penalty. NO ML, no training, no hidden model.
- Capacity: `load = active/max`; full → score 0 + waitlist; DB gate at request + accept.
- Explainability: card reasons map 1:1 to computed components (see MATCHING-ALGORITHM.md).
- Human oversight: alumni accept/decline; coordinator KPIs + audit; students choose, never auto-assigned.
- Limitations: small synthetic data; goal heuristic; Jaccard tag bias; no realtime conflict beyond day-level; single-machine perf.
- Fairness: popular mentors are demoted by load (anti-rich-get-richer); niche students get honest low scores, never fake matches.
- Appropriate use: college demo with synthetic data; not for production placement decisions without a real usability + bias review.
