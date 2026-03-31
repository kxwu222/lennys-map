---
id: "pm-guide-evals"
title: "Beyond vibe checks: A PM's complete guide to evals"
source: "Lenny's Newsletter"
guest: "Aman Khan"
topics: ["ai", "engineering", "leadership", "analytics"]
date: "2025-04-08"
subtitle: "How to master the emerging skill that can make or break an AI product"
wordCount: 3558
---

## Summary
Aman Khan (Arize AI, ex-Spotify/Cruise/Apple) argues that writing evals — not prompts — is the defining skill for AI PMs in 2025. Evals measure AI system quality like a driving test: checking awareness, decision-making, and safety. Unlike deterministic unit tests, evals handle non-deterministic, qualitative outputs. Three approaches exist: human evals (direct but sparse), code-based evals (cheap but limited for subjective tasks), and LLM-as-judge evals (scalable, natural language, but require calibration).

## Key Insight 1
Every great LLM eval has four parts: (1) Setting the role for the judge LLM, (2) Providing the context/data to grade, (3) Clearly articulating the goal — what "good" and "bad" look like, and (4) Defining terminology and labels precisely. Standard eval criteria include hallucination detection, toxicity/tone checks, and overall correctness. PMs can write eval prompts directly since they use natural language.

## Key Insight 2
The eval workflow has four phases: Collection (gather real user interactions, document edge cases, build a representative dataset of 10-100 labeled examples), First-pass evaluation (write initial eval prompts, aim for 90% accuracy vs. human labels), Iteration loop (refine prompts, expand dataset, use evals as the "final boss" when A/B testing prompts or swapping models), and Production monitoring (run evals continuously on live interactions, build dashboards tied to business outcomes).

## Key Insight 3
Common mistakes teams make: making evals too complex too quickly (creates noisy signals and lost trust), not testing for edge cases (use few-shot prompting with "good" and "bad" examples), and forgetting to validate eval results against real user feedback. Start simple — pick one critical feature, write a basic hallucination eval, run it on 5-10 real examples, then iterate.
