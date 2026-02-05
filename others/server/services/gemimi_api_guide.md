Gemini API Selection Guide
(For Antigravity Decision Engine)
1️⃣ What a Gemini API Key Actually Unlocks

A single Gemini API key gives access to all Gemini models, but:

Model choice determines:

Cost

Latency

Reasoning depth

Multimodal ability (text / image / audio / video)

Tooling (search, code execution, function calling)

👉 Antigravity’s job is NOT to choose the key
👉 Its job is to choose the MODEL per task

2️⃣ Model Families (Mental Model)

Think in 3 axes:

Axis	Question
Thinking	Does the task need deep reasoning or just fast response?
Modality	Text only? Image? Audio? PDF? Video?
Scale	One-off high quality or massive throughput?
3️⃣ Core Models Antigravity Should Care About
🧠 Gemini 3 Pro (gemini-3-pro-preview)

Use when:

Complex reasoning

Multi-step planning

Agentic workflows

Code analysis

Research synthesis

Long documents (1M tokens)

Strengths

Best reasoning

Strong tool use

Structured outputs

Search grounding

Trade-offs

Higher latency

Higher cost

Overkill for simple tasks

👉 Default for:

Planner agents

Research agents

Strategy generation

Architecture decisions

⚡ Gemini 3 Flash (gemini-3-flash-preview)

Use when:

You want Pro-level intelligence but faster

High throughput systems

Real-time agents

Strengths

Excellent price/performance

Supports thinking levels

Agent-friendly

Good for chains of calls

Trade-offs

Slightly weaker than Pro on hardest reasoning

👉 Default for:

Production agents

Conversational systems

Orchestration agents

RL environment feedback loops

🚀 Gemini 2.5 Flash (gemini-2.5-flash)

Use when:

Scale > perfection

Latency matters

Cost sensitive

Strengths

Extremely stable

Cheap

Fast

Still supports tools + reasoning

👉 Default for:

Bulk generation

Content variants

Caption/image prompt generation

Evaluation loops

🖼️ Image Models (Nano Banana)
Gemini 3 Pro Image (gemini-3-pro-image-preview)

Use when:

High-quality images

Text inside images

Brand-sensitive creatives

Iterative image editing

👉 Best for:
Marketing creatives, reels, ads, brand visuals

Gemini 2.5 Flash Image (gemini-2.5-flash-image)

Use when:

Speed

High volume image generation

Low cost

👉 Best for:
Bulk thumbnails, drafts, experiments

4️⃣ Thinking Levels (Critical for Antigravity)

Gemini 3 introduces Thinking Levels — this is HUGE.

Thinking Level	When to Use
minimal	Chat, autocomplete, cheap generation
low	Simple logic, extraction, formatting
medium	Most tasks (recommended for Flash)
high (default)	Deep reasoning, planning, coding

👉 Rule for Antigravity

If task involves decision making, tradeoffs, planning → HIGH

If task involves generation at scale → LOW / MEDIUM

5️⃣ Tooling Support (Very Important)
Capability	Supported
Function calling	✅
Google Search grounding	✅
URL context	✅
Code execution	✅
File search	✅
Maps grounding	❌ (Gemini 3)
Live streaming	❌ (except audio preview models)

👉 Antigravity can safely rely on:

Function calling

Structured JSON outputs

Search-augmented reasoning

6️⃣ Thought Signatures (Non-Optional for Agents)

Key rule:

If Antigravity builds multi-step agents or tool chains → Thought signatures must be preserved

Good news:

SDKs (Python / Node / Java) handle this automatically

Only manual REST orchestration needs care

👉 Agent memory + reasoning continuity depends on this

7️⃣ Cost-Aware Model Selection Logic (Recommended)
IF task.requires_deep_reasoning:
    use gemini-3-pro-preview (thinking=high)
ELSE IF task.is_production_agent:
    use gemini-3-flash-preview (thinking=medium)
ELSE IF task.is_bulk_generation:
    use gemini-2.5-flash
ELSE IF task.is_image_generation:
    IF brand_critical:
        use gemini-3-pro-image-preview
    ELSE:
        use gemini-2.5-flash-image

8️⃣ What Antigravity Should NEVER Do

❌ Don’t hardcode one model
❌ Don’t lower temperature aggressively (Gemini 3 expects default = 1.0)
❌ Don’t ignore thinking levels
❌ Don’t drop thought signatures in agent chains

9️⃣ Default Recommendation for Antigravity

If only ONE default must exist:

✅ gemini-3-flash-preview with thinking=medium

Then dynamically upgrade/downgrade per task.

10️⃣ Final Mental Shortcut

Pro = Think

Flash = Do

2.5 Flash = Scale

Pro Image = Brand

Flash Image = Volume