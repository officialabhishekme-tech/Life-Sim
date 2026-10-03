# Security Specification: LifeQuest 3D

## 1. Data Invariants
- Each user can only read and write their own UserProfile document at `/users/{userId}` where `userId == request.auth.uid`.
- Bank accounts can only be accessed and mutated by the authenticated owner at `/users/{userId}/bankAccounts/{accountId}`.
- Transactions can only be created and viewed by the authenticated account owner at `/users/{userId}/transactions/{transactionId}`.
- SIM Profiles are strictly scoped to the owner `/users/{userId}/simProfiles/{simId}`.
- P2P Transfers in `/p2pTransfers/{transferId}` require the sender to be authenticated (`request.auth.uid == incoming().senderId`) and amount must be positive.
- Default deny catch-all `match /{document=**} { allow read, write: if false; }` prevents any unauthorized access.

## 2. The Dirty Dozen Payloads (Should all be DENIED)
1. Unauthenticated write to `/users/alice`: Denied (not signed in).
2. Authenticated user Bob writing to `/users/alice`: Denied (`userId != request.auth.uid`).
3. User setting `hunger` to a string or negative number: Denied (validation helper type check).
4. User writing arbitrary fields (shadow update) to `/users/{userId}`: Denied.
5. User modifying another user's bank account balance at `/users/alice/bankAccounts/main`: Denied.
6. User reading another user's transactions: Denied.
7. User creating a transaction with negative amount or NaN: Denied.
8. User creating a P2P transfer with another user's senderId: Denied.
9. Blank document ID injection / path traversal attack: Denied (`isValidId` check).
10. Unauthenticated read of private banking data: Denied.
11. User deleting another user's simProfile: Denied.
12. Attempt to list another user's subcollections: Denied.
