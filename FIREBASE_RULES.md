# Firebase Rules for BananaWrite

Copy these rules into your Firebase Console.

---

## FIRESTORE RULES

Go to: **Firebase Console** → **Firestore Database** → **Rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - parent document
    match /users/{userId} {
      // Allow authenticated users to read/write their own user document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Nested data subcollection (profile, progress, session, quizSession)
      match /data/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Catch-all for any other nested documents
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Data Structure Reference

### Firestore Collections

```
users/
  {userId}/                    # Parent user document
    - createdAt: timestamp
    - email: string
    
    data/
      profile/                 # User profile
        - email: string
        - displayName: string
        - createdAt: timestamp
        - lastActive: timestamp
        
      progress/                # Learning progress
        - currentLesson: number
        - completedLessons: array
        - totalXP: number
        
      session/                 # Current writing session
        - status: string
        - writingTechnique: string
        - essayPrompt: string
        - essayDraft: string
        - wordCount: number
        - startedAt: timestamp
        - lastSavedAt: timestamp
        - submittedAt: timestamp
        
      quizSession/             # Quiz session data
        - status: string
        - essayText: string
        - essayErrors: array
        - currentQuiz: object
        - userAnswers: array
        - quizResults: object
        - learnedTopics: array
        - teacherFeedback: object
```
