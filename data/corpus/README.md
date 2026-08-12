# Ghanaian academic writing corpus

This directory holds the evaluation data for Lume AI. **Nothing here is
generated or synthesised** — every file is collected, anonymised and labelled by
the project team. If a file is absent, the research pages say
"Evaluation pending" rather than showing a number.

## What is required

| File | Purpose | Status |
|---|---|---|
| `pairs.jsonl` | 200+ labelled assignment pairs used to score the models | **Not yet collected** |
| `documents/` | Anonymised source assignments the pairs are drawn from | **Not yet collected** |

## `pairs.jsonl` format

One JSON object per line:

```jsonl
{"id":"p001","a":"…full text of passage A…","b":"…full text of passage B…","label":1,"kind":"paraphrase","source":"CS-DEPT-2025-S1"}
{"id":"p002","a":"…","b":"…","label":0,"kind":"unrelated","source":"CS-DEPT-2025-S1"}
```

| Field | Meaning |
|---|---|
| `id` | Stable identifier for the pair |
| `a`, `b` | The two passages being compared |
| `label` | `1` if B is derived from A (copied, reworded or translated); `0` if independent |
| `kind` | `verbatim`, `near-verbatim`, `paraphrase`, `translated`, `unrelated`, `same-topic` |
| `source` | Anonymised cohort identifier — never a student name or matric number |

`same-topic` negatives matter: two students writing independently about the same
reading should be labelled `0`. A model that cannot separate *same topic* from
*same source* is the failure mode the whole project is about.

## Collection requirements

Before any assignment enters this corpus:

1. **Consent** — the student has given informed, revocable consent for their
   work to be used in model evaluation.
2. **Anonymisation** — names, matric numbers, emails, supervisor names and any
   identifying detail in the body text are removed before the file is written.
   Cohorts are referred to by opaque identifiers only.
3. **Retention** — the corpus lives on university-controlled storage and is not
   uploaded to any third-party service.

These follow from the Ghana Data Protection Act (Act 843) obligations on
processing personal data for research: lawful basis, data minimisation, and
retention no longer than the research requires.

## Running the benchmark

```bash
npm run benchmark                                  # every available model
npm run benchmark -- --model all-MiniLM-L6-v2      # one model
npm run benchmark -- --threshold 0.80              # different decision threshold
```

Results are written to `data/evaluation/results.json` and picked up automatically
by the `/research` page. Delete that file to return the page to
"Evaluation pending".

## The third model

`ghanaian-minilm` is `all-MiniLM-L6-v2` fine-tuned on this corpus. It does not
exist yet. Once the fine-tune has been run, point `GHANAIAN_MODEL_ID` at the
checkpoint directory under `.models/` and re-run the benchmark; the research page
will start reporting it alongside the other two.
