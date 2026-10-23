# GitHub branch and phone-review workflow

The project targets `https://github.com/mawatason3-hash/Group12Ai`. It already has a `main` branch and existing feature history, so preserve the remote history and use ordinary (non-force) pushes. If `origin` is not configured locally, connect it:

```powershell
git remote add origin https://github.com/mawatason3-hash/Group12Ai.git
git fetch origin
```

After integrating the remote `main` history locally and making the project's commits, publish `main` and all six member branches:

```powershell
git push -u origin main
git push -u origin feature/hamody-ui
git push -u origin feature/alexander-directory
git push -u origin feature/christine-ask
git push -u origin feature/alain-ai-api
git push -u origin feature/solomon-release
git push -u origin feature/haroundeiy-qa
```

Each contributor should first make and push their own feature commits; the scaffold branches initially point to the same baseline and do not contain individual member commits. The remote also contains a separate `feature/ask-screen-navigation` branch; this scaffold does not overwrite it.

## Approving a pull request on a phone

1. Open the PR link sent by the contributor in the GitHub mobile app or phone browser and sign in.
2. Read the PR description and changed-files summary. Check the linked test evidence and ask the author about anything unclear.
3. Open **Files changed**, review the diff, and select **Review changes**.
4. Choose **Approve** only if the change is understood and ready to merge; otherwise choose **Request changes** or leave a comment.
5. Submit the review. Approval is not a merge: the repository maintainer merges the PR after required checks and approvals are satisfied.

Menu labels may vary slightly between app and browser versions. Do not approve a PR you have not reviewed.
