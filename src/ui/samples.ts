/** Sample workflows that show the classic "why didn't it run" traps. */
export interface Sample {
  id: string;
  title: string;
  blurb: string;
  yaml: string;
  scenario?: Record<string, unknown>;
}

export const SAMPLES: Sample[] = [
  {
    id: 'deploy-main',
    title: 'Deploy only on main',
    blurb: 'A build job, a deploy job that needs it, and a notify job with always(). Try a pull request, then a push to main, then mark build as failed.',
    yaml: `name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh

  notify:
    needs: [build, deploy]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - run: echo "build=\${{ needs.build.result }} deploy=\${{ needs.deploy.result }}"
`,
    scenario: { event: 'push', branch: 'main' },
  },
  {
    id: 'fork-footgun',
    title: 'The fork check that runs on every push',
    blurb: '`github.event.pull_request.head.repo.fork == false` looks safe. On a push event the left side is null, and null == false is true.',
    yaml: `name: Fork check
on: [push, pull_request]

jobs:
  internal-only:
    if: github.event.pull_request.head.repo.fork == false
    runs-on: ubuntu-latest
    steps:
      - run: echo "This has secrets and runs on pushes too"

  internal-only-fixed:
    if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.fork == false
    runs-on: ubuntu-latest
    steps:
      - run: echo "Only for pull requests from this repository"
`,
    scenario: { event: 'push', branch: 'feature/x' },
  },
  {
    id: 'label-gate',
    title: 'Run when a label is added',
    blurb: 'Without types: [labeled], the labeled event never starts the workflow, and contains() on labels only sees the labels present at that moment.',
    yaml: `name: Release checks
on:
  pull_request:
    types: [opened, synchronize, labeled]

jobs:
  release-checks:
    if: contains(github.event.pull_request.labels.*.name, 'release')
    runs-on: ubuntu-latest
    steps:
      - run: ./release-checks.sh

  draft-skip:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - run: echo "Not a draft"
`,
    scenario: { event: 'pull_request', action: 'labeled', labels: 'release, bug' },
  },
  {
    id: 'skipped-needs',
    title: 'A skipped job skips everything after it',
    blurb: 'lint is skipped on tags, so test (which needs lint) is skipped too, even though test has no condition. The report job shows the two ways out, and after-report shows that always() rescues only the job it is on: status functions look at every ancestor (verified with real runs).',
    yaml: `name: Pipeline
on:
  push:
    branches: ['**']
    tags: ['v*']

jobs:
  lint:
    if: github.ref_type == 'branch'
    runs-on: ubuntu-latest
    steps: [{ run: npm run lint }]

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps: [{ run: npm test }]

  report:
    needs: [lint, test]
    if: \${{ !cancelled() }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "lint=\${{ needs.lint.result }} test=\${{ needs.test.result }}"

  report-only-if-test-ran:
    needs: [lint, test]
    if: always() && needs.test.result == 'success'
    runs-on: ubuntu-latest
    steps: [{ run: echo ok }]

  after-report:
    needs: report
    runs-on: ubuntu-latest
    steps:
      - run: echo "report ran, but lint was skipped upstream"
`,
    scenario: { event: 'push', refType: 'tag', tag: 'v1.2.0' },
  },
  {
    id: 'dispatch-inputs',
    title: 'workflow_dispatch inputs: boolean vs string',
    blurb: 'inputs.deploy is a real boolean; comparing it to the string \'true\' never matches. github.event.inputs.deploy is the string.',
    yaml: `name: Manual deploy
on:
  workflow_dispatch:
    inputs:
      deploy:
        type: boolean
        default: false
      environment:
        type: choice
        options: [staging, production]
        default: staging

jobs:
  deploy-bool:
    if: inputs.deploy == true
    runs-on: ubuntu-latest
    steps: [{ run: echo deploying }]

  deploy-string:
    if: inputs.deploy == 'true'
    runs-on: ubuntu-latest
    steps: [{ run: echo "never runs" }]

  deploy-event-inputs:
    if: github.event.inputs.deploy == 'true'
    runs-on: ubuntu-latest
    steps: [{ run: echo "string form works here" }]

  production:
    if: inputs.environment == 'production'
    runs-on: ubuntu-latest
    steps: [{ run: echo prod }]
`,
    scenario: { event: 'workflow_dispatch', branch: 'main', inputs: { deploy: true, environment: 'production' } },
  },
  {
    id: 'paths-filter',
    title: 'Path filters and docs-only pushes',
    blurb: 'paths-ignore skips the run only when every changed file is ignored. Try changing docs/guide.md alone, then add src/app.ts.',
    yaml: `name: Tests
on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - '**.md'
  pull_request:
    paths:
      - 'src/**'
      - '!src/**/*.test.ts'

jobs:
  test:
    runs-on: ubuntu-latest
    steps: [{ run: npm test }]
`,
    scenario: { event: 'push', branch: 'main', changedFiles: 'docs/guide.md\nREADME.md' },
  },
  {
    id: 'hashfiles-job-if',
    title: 'hashFiles in a job-level if',
    blurb: 'GitHub rejects the whole file: hashFiles() only exists at the step level. The run shows up as a failed run named after the file, with no jobs.',
    yaml: `name: Cache check
on: push

jobs:
  needs-lockfile:
    if: hashFiles('**/package-lock.json') != ''
    runs-on: ubuntu-latest
    steps: [{ run: npm ci }]

  fine:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - if: hashFiles('**/package-lock.json') != ''
        run: npm ci
`,
    scenario: { event: 'push', branch: 'main' },
  },
];
