# Pineapple Note iOS tests

The native package includes regression tests for:

- keeping an intentionally empty notes library empty after relaunch;
- persisting flashcard review counts;
- recording quiz attempts and preserving them through JSON backup/restore;
- merging backups without duplicating notes;
- validating multiple-choice questions.

The iOS Simulator workflow runs these tests on a GitHub-hosted macOS runner before launching the app. No Apple Developer signing account is required for this test stage.

GitHub Actions uses per-branch concurrency groups and cancels superseded checks so only the newest native iOS revision continues through CI.

The full simulator workflow runs regression tests, builds and launches the app. The separate unsigned artifact build is available manually from GitHub Actions when a packaged .app is needed.
