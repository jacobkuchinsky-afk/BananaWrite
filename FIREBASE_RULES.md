# Firebase Rules for BananaWrite

Copy these rules into your Firebase Console.

---

## FIRESTORE INDEXES

Go to: **Firebase Console** → **Firestore Database** → **Indexes** → **Add Index**

Create this composite index for bug reports queries:

| Collection ID | Fields indexed | Query scope |
|---------------|----------------|-------------|
| bugReports | userId (Ascending), createdAt (Descending) | Collection |

Or click the link in the console error message to auto-create the index.

---

## FIRESTORE RULES

Go to: **Firebase Console** → **Firestore Database** → **Rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin email constant
    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'jacob.kuchinsky@gmail.com';
    }
    
    // App Settings - admin only write, authenticated users can read
    match /appSettings/{document} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Analytics - admin can read, authenticated users can write (for tracking)
    match /analytics/{document} {
      allow read: if isAdmin();
      allow write: if request.auth != null;
    }
    
    // Update Notifications - admin can create, all authenticated users can read
    match /updateNotifications/{notificationId} {
      // All authenticated users can read notifications
      allow read: if request.auth != null;
      
      // Only admin can create notifications
      allow create: if isAdmin();
      
      // No updates or deletes allowed (notifications are permanent)
      allow update, delete: if false;
    }
    
    // Bug Reports - users can create and read their own, admin can read/update all
    match /bugReports/{reportId} {
      // Any authenticated user can create a bug report
      allow create: if request.auth != null;
      
      // Users can read their own bug reports, admin can read all
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || isAdmin());
      
      // Only admin can update bug reports
      allow update: if isAdmin();
      
      // No one can delete bug reports
      allow delete: if false;
      
      // Messages subcollection within bug reports
      match /messages/{messageId} {
        // Users can read messages on their own reports, admin can read all
        allow read: if request.auth != null && 
          (get(/databases/$(database)/documents/bugReports/$(reportId)).data.userId == request.auth.uid || isAdmin());
        
        // Users can create messages on their own reports, admin can create on any
        allow create: if request.auth != null && 
          (get(/databases/$(database)/documents/bugReports/$(reportId)).data.userId == request.auth.uid || isAdmin());
        
        // No one can update or delete messages
        allow update, delete: if false;
      }
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Admin can read all users
      allow read: if isAdmin();
      
      match /data/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        allow read: if isAdmin();
      }
      
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        allow read: if isAdmin();
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

bugReports/
  {reportId}/                  # Bug report document
    - userId: string
    - userEmail: string
    - displayName: string
    - contextType: string      # 'essay_check' | 'essay_review' | 'quiz_grade' | 'general'
    - originalResponse: string
    - userContent: string
    - originalPrompt: string   # Optional
    - selfReviewResult: object # Optional (for AI contest reports)
    - status: string           # 'pending' | 'reviewed' | 'resolved'
    - createdAt: timestamp
    - reviewedAt: timestamp    # Optional
    - reviewedBy: string       # Optional
    - adminNotes: string       # Optional
    
    messages/
      {messageId}/             # Chat messages
        - senderId: string
        - senderEmail: string
        - senderName: string
        - isAdmin: boolean
        - content: string
        - createdAt: timestamp

appSettings/
  global/                      # Global app configuration
    - maxErrorsForRedo: number
    - sameErrorQuizThreshold: number
    - totalErrorQuizThreshold: number
    - quizPassingScore: number
    - updatedAt: timestamp
    - updatedBy: string

analytics/
  daily_{date}/                # Daily analytics (YYYY-MM-DD)
    - date: string
    - totalUsers: number
    - essaysSubmitted: number
    - quizzesCompleted: number
    - quizzesPassed: number
    - averageQuizScore: number
    - errorTypesBreakdown: object

updateNotifications/
  {notificationId}/            # Update announcement
    - title: string
    - bulletPoints: array      # Array of strings
    - createdAt: timestamp
    - createdBy: string        # Admin email
```
