# Broadcast label contrast repair

Restore readable comparison values under the existing visual profiles. The broadcast template retains a light pink value color from its dark theme after the warm-paper profile changes the background. Keep the layouts, numeric values and unconfigured legacy theme intact.

- Add an offline browser regression that computes comparison-value text contrast against both configured palette backgrounds; verify the warm-paper case fails before the fix.
- Override broadcast comparison values with the selected profile ink in `src/production/visual-profile.ts`.
- Run the regression, required static/unit checks, synthetic smoke and review example; inspect actual episode frames outside this repository.
- Review the diff, integrate through a PR with current-base checks and clean up only this task worktree after merge.

No real manuscripts or media belong in this repository. Episode audit records and validation logs remain in the project's external data directory.
