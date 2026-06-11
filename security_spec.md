# Security Specification for Ragnar's 35-Day Challenge

This document lays down the access control, identity ownership, and data payload constraints for the application's Firestore resources.

## 1. Data Invariants

1. **Owner Isolation Only**: A user's profile or log under `/profiles/{userId}` can ONLY be read, written, or modified if the authenticated user's standard auth unique ID (`request.auth.uid`) matches the `userId` in the document path.
2. **Immutable Paths**: Every subresource (daily diet logs) strictly inherits authorization from the parent User Profile document and must match `userId`.
3. **Valid Identifiers**: Path document structural identifiers (including target date strings `YYYY-MM-DD`) must not accept arbitrary massive text payloads. They are bounded up to 128 characters.

## 2. Payloads Analysis ("Dirty Dozen")

The following payloads represent illegal or malicious attempts to bypass access policies:

- **Type Poisoning**: Attempt to pass non-numeric variables as BMR.
- **Identity Theft**: Attempt to write profile attributes with a different authenticated user ID.
- **Ghost Field injection**: Attempt to write undocumented metadata variables.
- **Overlarge list attributes**: Inputting massive food item counts to clog system assets.

All validation matches are handled natively via the custom `firestore.rules`.
