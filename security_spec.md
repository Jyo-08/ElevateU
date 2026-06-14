# Rebound AI Security Specification

## 1. Data Invariants

1. **Student Isolation**: No student can view, create, edit, or delete another student's profile, stress journals, comeback plans, active quests/tasks, or chatbot transcripts. All operations are strictly audited by mapping request UID directly to the Resource Owner UID.
2. **Profile Lock-down**: Users cannot change other users' XP or streak stats, and the system limits displayName sizes.
3. **Immutability of History**: Historical stress journal entry timestamps (`createdAt`) and primary owner fields are frozen once saved and cannot be mutated during edits.
4. **ID Poisoning Immunity**: All custom item identifiers must conform to strict alphanumeric strings up to 128 characters, preventing SQL or buffer strain.

## 2. The Dirty Dozen Payloads (Adversarial Vectors)

We guarantee defenses against the following malicious payloads:

1. **Profile Hijack**: Attempt to create a profile where `{userId: "victim_id"}` under auth user `attacker_id`.
2. **XP Spoofing**: Attempt to update profile XP to `999999` while bypassing valid quest complete records.
3. **Journal Snoop**: Attempt to read list of journals without a filter constraining `resource.data.userId == request.auth.uid`.
4. **Journal Cross-Update**: Attempt to edit victim's journal text using attacker's credentials.
5. **Timestamp Decouple**: Attempt to create or update task list item using client-generated or past timestamp instead of `request.time`.
6. **ID Injection (Poisoning)**: Attempt to create a task using document ID `../../../illegal_characters` to disrupt file/object trees.
7. **Size Fatigue**: Attempting to upload a journal entry of 2MB to stress database storage thresholds.
8. **Ghost Field Poisoning**: Attempt to update a user's task with an unmodeled field like `isVerifiedAdmin: true`.
9. **Null State Overwrite**: Overwriting a comeback plan's `planText` with null/blank types leading to app runtime crashes.
10. **Chat Hijack**: Reading or corrupting another user's interactive AI feedback loop in the chat subcollection.
11. **Anonymity Scraping**: Attempt to read the entire student database using anonymous, unverified sessions without constraints.
12. **Status Escalation**: Upgrading completed status indices on tasks by modifying immutable reference criteria.

## 3. Security Rules Implementation Plan

We will implement `firestore.rules` mapping these assertions to programmatic helpers such as `isValidProfile()`, `isValidJournal()`, `isValidAcademicTask()`, and `isValidRecoveryPlan()`.
