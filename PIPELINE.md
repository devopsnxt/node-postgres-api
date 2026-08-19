# CI/CD Pipeline Documentation

This repository uses GitHub Actions to automate testing, security scanning, container image building, and release management. The pipeline is broken down into three main workflows and one shared composite action.

---

## 1. Pull Request Workflow (`pull-request.yml`)

**When it runs:** Automatically when a Pull Request is opened, reopened, synchronized (new commits pushed), or marked ready for review.

**Purpose:** To validate the code changes before they are allowed to merge into the `main` branch.

**What it does:**
- Runs the shared **CI Checks** (Linting, Tests, Snyk, CodeQL, SonarCloud, Docker build, Trivy, SBOM).
- Extracts a SARIF artifact if Gitleaks finds any accidentally committed secrets.
- Uses AI to review the exact code diff for logical bugs, SQL injection, and security flaws.
- Comments on the Pull Request thread with a summary of Trivy vulnerability counts, SBOM component counts, and the AI Review report.
- **Auto-labels** the Pull Request based on the PR title and branch name to help categorize it for the Release Drafter.

---

## 2. Fast-Forward Merge Workflow (`fast-forward-merge.yml`)

**When it runs:** Automatically whenever code is pushed or merged directly into the `main` branch.

**Purpose:** To build the final artifacts for the `main` branch, sign them, and push them to the registry.

**What it does:**
- Runs the shared **CI Checks**.
- Logs into GitHub Container Registry (GHCR).
- Pushes the Docker image tagged with the specific git commit SHA and the `latest` tag.
- Uses **Cosign** to cryptographically sign the Docker image.
- Attaches the generated SBOM (Software Bill of Materials) as an attestation to the image in GHCR.
- Verifies the signature and attestation to guarantee image integrity.
- Uses AI to assess the release readiness of the changes pushed to `main` (summarizing risks and rollback recommendations).

---

## 3. Release Workflow (`release.yml`)

**When it runs:** Manually triggered via GitHub's `workflow_dispatch` UI.

**Purpose:** To publish an official, versioned GitHub Release.

**How to use it:**
1. Go to the **Actions** tab in GitHub.
2. Select **Release** from the left sidebar.
3. Click **Run workflow**.
4. Enter a Semantic Version number (e.g., `v1.0.0`, `v1.0.1`, `v2.0.0`) in the input field. *Note: It must start with a `v`.*
5. Click **Run workflow**.

**What it does:**
- Validates that the input version strictly follows Semantic Versioning rules.
- Creates an immutable git tag for the specified version and pushes it to the repository.
- Instructs **Release Drafter** to take the draft release notes it has been building (based on merged PR labels) and officially publish them as a GitHub Release attached to the new tag.

---

## 4. Shared CI Checks (`ci-checks/action.yml`)

To keep the pipelines DRY (Don't Repeat Yourself), the core scanning logic is extracted into a shared **Composite Action** located at `.github/actions/ci-checks/action.yml`. Both the PR and Merge workflows call this action.

**Checks included:**
- **Gitleaks:** Scans for hardcoded secrets/API keys.
- **Node.js Setup:** Installs NPM dependencies.
- **CodeQL (SAST):** Scans custom source code for security flaws.
- **Lint & Tests:** Runs standard `npm run lint` and `npm test`.
- **Snyk (SCA):** Scans `package.json` dependencies for known vulnerabilities.
- **SonarCloud:** Measures code quality, bugs, and test coverage (requires Java 17).
- **Docker Build:** Builds the application into a container image.
- **Anchore SBOM:** Generates a CycloneDX JSON inventory of the Docker image contents.
- **Trivy:** Scans the Docker image filesystem for OS-level vulnerabilities (e.g., Debian/Alpine CVEs).

---

## Commit & PR Title Guidelines (Release Drafter)

Because we use **Release Drafter**, the titles of your Pull Requests determine how they appear in the final release notes. 

We use an autolabeler configuration (`.github/release-drafter.yml`) that maps title prefixes to labels. For the best automated release notes, prefix your PR titles with one of the following:

- `(bug):` or `fix:` → Categorized under **🐛 Bug Fixes** (Label: `bug`)
- `(feature):` or `feat:` → Categorized under **🚀 Features** (Label: `enhancement`)
- `(docs):` or `docs:` → Categorized under **📝 Documentation** (Label: `documentation`)
- `(chore):` or `chore:` → Categorized under **🧰 Maintenance** (Label: `chore`)

*(If a PR title doesn't follow these prefixes, you can still manually apply the labels to the PR in the GitHub UI before merging).*
