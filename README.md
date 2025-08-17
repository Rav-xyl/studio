# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Firestore Setup

This project uses Firestore to store data. To allow the application to read from and write to the database, you must deploy the security rules.

**Run the following command in your terminal:**

```bash
firebase deploy --only firestore:rules
```

This will apply the permissive rules defined in `firestore.rules`, which are necessary for the application to function correctly in this development environment.
