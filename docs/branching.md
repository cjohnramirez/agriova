# Branching and git workflow

## The three kinds of branch

| Branch | Purpose | Branch from | Merge into |
| --- | --- | --- | --- |
| `main` | Always deployable. Only ever receives merges from `dev`. Never commit here directly. | — | — |
| `dev` | Integration branch. All day-to-day work lands here. This is the branch you pull before starting anything. | `main` | `main` |
| `feature/*`, `fix/*`, `chore/*` | One branch per unit of work, short-lived. | `dev` | `dev` |

`main` moves only when a milestone is ready to demo or ship. Everything else
flows through `dev`.

## Naming

Use a type prefix, then a short kebab-case description. Keep it under about
five words and describe the outcome, not the file you touched.

```
feature/sqlite-schema
feature/expense-entry-flow
feature/phone-otp-auth
fix/profit-total-rounding
chore/upgrade-expo-57-1
```

Where a branch maps to a numbered step in the build order, lead with the
number so the sequence stays obvious in the branch list:

```
feature/02-sqlite-schema
feature/03-entry-flows
```

## Starting work

```sh
git checkout dev
git pull
git checkout -b feature/expense-entry-flow
```

`pull.rebase` is set to true for this repo, so pulling replays your local
commits on top of the remote rather than producing a merge bubble. Combined
with `rebase.autoStash`, you can pull with a dirty working tree and your
changes are stashed and restored automatically.

## Finishing work

```sh
git push                 # no -u needed; push.autoSetupRemote handles it
gh pr create --base dev
```

Every feature branch merges through a pull request, even when you are the only
reviewer. The PR is the record of why the change exists, which matters on a
project where the reasoning lives in a pitch deck rather than in the code.

Squash on merge so `dev` keeps one commit per feature. The detail stays visible
in the PR.

## Releasing to main

When a milestone is demoable, open a pull request from `dev` into `main`. Do
not squash this one: `main` should keep the individual feature commits so the
history stays readable.

```sh
gh pr create --base main --head dev --title "Release: offline farm ledger"
```

## Commit messages

Use a conventional prefix. The prefix is what makes a squashed `dev` history
scannable months later.

```
feat: record expenses against a crop cycle
fix: stop profit total drifting on partial sales
chore: pin react-dom to match react 19.2.3
docs: write the branching workflow
refactor: extract the numeric keypad from the expense screen
```

Write the subject in the imperative and keep it under about 70 characters. Put
the why in the body when the change is not self-evident.

## Before you push

A `pre-push` hook runs the TypeScript check. If it fails, the push is blocked.
That is deliberate: a red `dev` branch blocks everyone else on the team.

To bypass it in a genuine emergency:

```sh
git push --no-verify
```

If you find yourself reaching for that flag regularly, the hook is not the
problem.

## After cloning

Git does not carry hook configuration across a clone. The `prepare` script in
`package.json` points git at `.githooks` for you, so a plain `npm install` is
enough. If the hook is not firing, run it by hand:

```sh
git config core.hooksPath .githooks
```

## Handy scripts

| Command | Does |
| --- | --- |
| `npm run typecheck` | The same check the pre-push hook runs |
| `npm run bundle:check` | Bundles both platforms, catching what typecheck cannot |
