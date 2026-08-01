# AI Adoption Plan for the Pipeline

## Purpose

Adopt AI in the CI/CD pipeline to improve feedback, security triage, and release visibility without allowing AI to bypass deterministic engineering controls.

AI will assist developers and explain results. Tests, SonarCloud, Snyk, Trivy, SBOM generation, image signing, and deployment approvals remain the source of truth for enforcement.

## Current Pipeline Context

The pipeline currently includes:

- Pull request validation
- Node.js installation, linting, and tests
- SonarCloud analysis and quality gate
- Docker image build and publication to GHCR
- Snyk dependency scanning
- Trivy filesystem scanning
- Syft SBOM generation
- Cosign image signing and SBOM attestation
- GitHub release creation
- PR comments and GitHub Actions job summaries

## Target Pipeline Flow

```text
Pull request
  |
  +-- Checkout and dependency install
  +-- AI change summary
  +-- AI review of changed files
  +-- Lint and tests
  +-- SonarCloud analysis and quality gate
  +-- Snyk dependency scan
  +-- Trivy filesystem/image scan
  +-- SBOM generation
  +-- AI security and quality explanation
  +-- PR summary comment
  +-- Required checks and merge protection
          |
          v
Main branch
  |
  +-- Build and push image
  +-- Cosign signature
  +-- SBOM attestation
  +-- AI release summary
  +-- Manual production approval
```

## Phase 1: Read-Only Reporting

### Goal

Add AI feedback without allowing it to modify code, approve changes, or block merges.

### Reports

The AI report should summarize:

- Changed files and behavior
- Test and lint status
- SonarCloud quality gate and metrics
- Snyk vulnerability counts and important packages
- Trivy critical and high findings
- Unfixed vulnerability count
- SBOM component count
- Image digest and signing status
- Recommended next action
- Overall risk: Low, Medium, or High

### Output

Publish the report to:

- GitHub Actions Job Summary
- Pull request comment for same-repository PRs

### Rules

- AI is informational only.
- AI findings do not block merges.
- Existing deterministic checks continue to enforce quality and security.
- Missing reports must be clearly marked as unavailable, not treated as passed.

## Phase 2: Targeted AI Review

### Goal

Review only the changed code and directly related configuration.

### Allowed Input

Provide only the minimum required context:

- Changed source files
- Relevant tests
- `package.json` and lock file
- `Dockerfile`
- Workflow files affected by the change
- SonarCloud, Snyk, Trivy, and test reports

### Review Areas

- Bugs and behavioral regressions
- Authentication and authorization issues
- Injection risks
- Secret exposure
- Unsafe Docker or workflow configuration
- Missing validation and error handling
- Missing tests
- API contract or database migration risks

### Structured Output

```json
{
  "summary": "Short explanation",
  "findings": [
    {
      "severity": "high",
      "file": "src/example.js",
      "line": 42,
      "issue": "Description",
      "recommendation": "Suggested fix"
    }
  ],
  "testRecommendations": [],
  "releaseRisk": "low"
}
```

### Rules

- Findings must include evidence from the supplied code or reports.
- AI must not invent file names, line numbers, or vulnerabilities.
- AI review remains non-blocking until accuracy has been evaluated.

## Phase 3: Controlled Automation

### Goal

Allow AI to prepare changes while keeping humans and branch protection in control.

### Permitted Actions

- Generate draft fixes
- Generate or update tests
- Update documentation
- Suggest dependency upgrades
- Open a draft pull request

### Prohibited Actions

AI must not:

- Push directly to `main`
- Approve its own changes
- Change branch protection
- Disable SonarCloud, Snyk, Trivy, tests, signing, or attestations
- Deploy directly to production
- Access production credentials
- Modify secrets or security settings

All generated changes must go through the normal pull request checks.

## Phase 4: Release Intelligence

### Goal

Generate a release-readiness report after deterministic checks complete.

### Example

```text
Release readiness: PASS WITH WARNINGS

Tests: Passed
SonarCloud: Passed
Critical vulnerabilities: 0
High vulnerabilities: 2
SBOM components: 148
Image signature: Verified
SBOM attestation: Verified
API risk: Medium
Database migration detected: No
Rollback concern: Low
```

### Release Risk Checks

The AI should identify:

- API contract changes
- Database migrations
- Configuration changes
- Authentication or authorization changes
- Breaking dependency upgrades
- Container base-image changes
- Rollback concerns
- Changes requiring manual approval

AI must not replace production approval or deterministic release gates.

## First Implementation Slice

Start with one workflow step after SonarCloud, Trivy, Snyk, and SBOM generation:

```text
Generate AI pipeline report
```

The first version should:

1. Collect the existing scan summaries.
2. Collect the pull request diff or main-branch commit diff.
3. Redact secrets and sensitive values.
4. Send only the approved context to the AI provider.
5. Validate the response against a strict JSON schema.
6. Render a Markdown report in `GITHUB_STEP_SUMMARY`.
7. Add the report to the PR comment when permissions allow.
8. Fail open for AI service errors, while clearly reporting that AI analysis was unavailable.

The first implementation should not modify files or block merges.

## Phase 1 Configuration

Add the following repository secret before enabling the report:

```text
AI_API_KEY
```

Optional repository variables:

```text
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

The workflow uses an OpenAI-compatible chat-completions endpoint. A compatible provider can be selected by changing `AI_API_URL` and `AI_MODEL`; the API key remains stored in GitHub Actions Secrets.

When `AI_API_KEY` is not configured, the AI steps are skipped and the deterministic pipeline continues normally. When the provider is unavailable, the workflow writes an "AI report unavailable" message and continues; AI is advisory in Phase 1.

## Security and Permissions

Use a dedicated GitHub App or token with minimum permissions:

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

The AI step must never receive:

- `COSIGN_PRIVATE_KEY`
- `COSIGN_PASSWORD`
- Cloud credentials
- Production connection strings
- Deployment tokens
- Unmasked secrets

Store the AI credential in GitHub Actions Secrets, for example:

```yaml
env:
  AI_API_KEY: ${{ secrets.AI_API_KEY }}
```

Additional controls:

- Redact secrets before sending logs or source code.
- Limit prompt size and uploaded content.
- Do not send unrelated repository files.
- Log the model, prompt version, and report status, but never the secret.
- Pin third-party actions to reviewed versions.
- Do not allow untrusted fork code to access AI write permissions.
- Keep AI output separate from executable shell commands.

## Merge and Release Policy

Deterministic checks remain required:

- Tests and lint
- SonarCloud quality gate
- Snyk policy, when enabled
- Trivy policy, when enabled
- Image signing
- SBOM attestation
- Required GitHub branch protection checks

AI should initially be advisory. A future AI check may block merges only when:

- It has a defined, narrow policy.
- False-positive behavior is measured.
- Findings are reproducible and evidence-based.
- A human override process exists.
- The policy is documented and reviewed.

## Rollout and Success Criteria

### Phase 1 Exit Criteria

- AI report appears in PRs and job summaries.
- No secrets are exposed to the provider or logs.
- AI failures do not hide deterministic scan failures.
- Reports identify unavailable data correctly.

### Phase 2 Exit Criteria

- Review findings contain valid file and line references.
- False-positive rate is tracked across multiple pull requests.
- Developers can mark findings as useful or not useful.

### Phase 3 Exit Criteria

- Generated changes always use draft pull requests.
- Normal CI checks run on every generated change.
- No direct production or main-branch writes are possible.

### Phase 4 Exit Criteria

- Release summaries match the underlying scan artifacts.
- Image digest, signature, and SBOM attestation are verified.
- Production approvals remain human-controlled.

## Suggested Metrics

Track the following during adoption:

- AI report success rate
- AI response time
- AI service failure count
- Number of useful findings
- False-positive rate
- Developer feedback rate
- Time spent triaging security findings
- Number of generated draft fixes accepted
- Number of deterministic checks bypassed: target is zero

## Implementation Order

1. Add read-only AI report to the pull request job.
2. Add the same report to the main-branch release job.
3. Add strict JSON validation and secret redaction.
4. Add targeted changed-file review.
5. Measure accuracy and developer feedback.
6. Add draft test and fix generation.
7. Add release-risk and release-readiness reporting.
8. Review whether any narrow AI policy should become merge-blocking.
