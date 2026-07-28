# Public Repository Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Mboker Img with a clear, visible credit to the frontend source project.

**Architecture:** Attribution lives in both repository README introductions and the GitHub About description. Documentation is committed and pushed before repository visibility changes, so the source credit is present from the first public view.

**Tech Stack:** Markdown, Git, GitHub CLI

---

### Task 1: Add Frontend Source Attribution

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`

- [ ] **Step 1: Update the Chinese introduction**

Place this block after the opening Mboker Img description:

```markdown
> **前端来源与致谢**：本项目的前端设计与动画基于 [ricocc/tink-photography](https://github.com/ricocc/tink-photography) 开发。Mboker Img 在其基础上增加了内容管理后台、图集与图片管理、特辑排版、文章发布、关于页和站点设置等功能。
```

- [ ] **Step 2: Update the English introduction**

Rename the title to `Mboker Img`, replace the old Tink introduction with the current CMS positioning, and add:

```markdown
> **Frontend source and credit:** The frontend design and animations are based on [ricocc/tink-photography](https://github.com/ricocc/tink-photography). Mboker Img extends it with a CMS for galleries, images, special layouts, posts, the About page, and site settings.
```

- [ ] **Step 3: Verify the exact attribution link**

Run:

```powershell
rg -n "ricocc/tink-photography|前端来源与致谢|Frontend source and credit" README.md README.en.md
git diff --check -- README.md README.en.md
```

Expected: both README files contain the exact upstream URL and Git reports no whitespace errors.

- [ ] **Step 4: Commit the documentation**

```bash
git add README.md README.en.md
git commit -m "docs: credit upstream frontend source"
```

### Task 2: Push Attribution and Publish Repository

**Files:**
- No local file changes.

- [ ] **Step 1: Push the documentation before changing visibility**

```bash
git push origin HEAD:main
```

Expected: remote `main` advances to the attribution commit.

- [ ] **Step 2: Update the GitHub About description**

```bash
gh repo edit terrenceftz/mboker-img --description "Mboker Img photography portfolio and CMS. Frontend based on ricocc/tink-photography."
```

- [ ] **Step 3: Make the repository public**

```bash
gh repo edit terrenceftz/mboker-img --visibility public --accept-visibility-change-consequences
```

- [ ] **Step 4: Verify the public result**

Query the repository metadata and the raw README files through GitHub. Confirm visibility is `PUBLIC`, default branch is `main`, the GitHub description contains `ricocc/tink-photography`, both README files contain the exact upstream URL, and remote `main` matches local `HEAD`.
