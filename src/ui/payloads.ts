/** Example webhook payloads (from GitHub's @octokit/webhooks-examples), one per event, bundled at build time. */
import push from '../../data/webhooks/push.json' with { type: 'json' };
import pull_request from '../../data/webhooks/pull_request.json' with { type: 'json' };
import pull_request_target from '../../data/webhooks/pull_request_target.json' with { type: 'json' };
import pull_request_review from '../../data/webhooks/pull_request_review.json' with { type: 'json' };
import pull_request_review_comment from '../../data/webhooks/pull_request_review_comment.json' with { type: 'json' };
import workflow_dispatch from '../../data/webhooks/workflow_dispatch.json' with { type: 'json' };
import schedule from '../../data/webhooks/schedule.json' with { type: 'json' };
import release from '../../data/webhooks/release.json' with { type: 'json' };
import issues from '../../data/webhooks/issues.json' with { type: 'json' };
import issue_comment from '../../data/webhooks/issue_comment.json' with { type: 'json' };
import create from '../../data/webhooks/create.json' with { type: 'json' };
import delete_ from '../../data/webhooks/delete.json' with { type: 'json' };
import workflow_run from '../../data/webhooks/workflow_run.json' with { type: 'json' };
import merge_group from '../../data/webhooks/merge_group.json' with { type: 'json' };
import repository_dispatch from '../../data/webhooks/repository_dispatch.json' with { type: 'json' };
import discussion from '../../data/webhooks/discussion.json' with { type: 'json' };
import discussion_comment from '../../data/webhooks/discussion_comment.json' with { type: 'json' };
import label from '../../data/webhooks/label.json' with { type: 'json' };
import fork from '../../data/webhooks/fork.json' with { type: 'json' };
import watch from '../../data/webhooks/watch.json' with { type: 'json' };
import milestone from '../../data/webhooks/milestone.json' with { type: 'json' };
import check_run from '../../data/webhooks/check_run.json' with { type: 'json' };
import check_suite from '../../data/webhooks/check_suite.json' with { type: 'json' };
import deployment from '../../data/webhooks/deployment.json' with { type: 'json' };
import deployment_status from '../../data/webhooks/deployment_status.json' with { type: 'json' };
import status from '../../data/webhooks/status.json' with { type: 'json' };

export interface PayloadFile {
  actions: string[];
  payload: Record<string, unknown>;
}

export const PAYLOADS: Record<string, PayloadFile> = {
  push, pull_request, pull_request_target, pull_request_review, pull_request_review_comment,
  workflow_dispatch, schedule, release, issues, issue_comment, create, delete: delete_, workflow_run,
  merge_group, repository_dispatch, discussion, discussion_comment, label, fork, watch, milestone,
  check_run, check_suite, deployment, deployment_status, status,
} as Record<string, PayloadFile>;

export const EVENT_ORDER = [
  'push', 'pull_request', 'pull_request_target', 'workflow_dispatch', 'schedule', 'release', 'issues', 'issue_comment',
  'create', 'delete', 'workflow_run', 'merge_group', 'repository_dispatch', 'pull_request_review', 'pull_request_review_comment',
  'discussion', 'discussion_comment', 'label', 'fork', 'watch', 'milestone', 'check_run', 'check_suite', 'deployment', 'deployment_status', 'status',
];
