# Baseline Comparison (real run, 2026-09-14)

`node backend/scripts/baseline-compare.js` on live Oracle seed (33 users, 37 slots): 14 synthetic requests × 12 alumni.

| Metric | Baseline (greedy domain-only, no capacity) | Proposed (weighted + capacity-aware) |
|---|---|---|
| Domain-hit rate | 71.4% | 71.4% |
| Capacity violations | 4 | 0 |
| Full-mentor picks | 4 | 0 (waitlisted) |
| Avg top-1 score | n/a | 47.0 |
| Explanations | none | reasons[] + breakdown every pick |

Conclusion: relevance ties on this small seed; the proven win is zero overloads + explainability + audit. Rerun anytime with Oracle up.
