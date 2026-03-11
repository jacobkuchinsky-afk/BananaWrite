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
    // Super admin - always has full access
    function isSuperAdmin() {
      return request.auth != null && request.auth.token.email == 'jacob.kuchinsky@gmail.com';
    }
    
    // Check if user is in the admin list OR is the super admin
    function isAdmin() {
      return isSuperAdmin() ||
        (request.auth != null &&
         exists(/databases/$(database)/documents/appSettings/admins) &&
         request.auth.token.email in get(/databases/$(database)/documents/appSettings/admins).data.emails);
    }
    
    // Check if user is in the teacher list
    function isTeacher() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/appSettings/teachers) &&
        request.auth.token.email in get(/databases/$(database)/documents/appSettings/teachers).data.emails;
    }
    
    // App Settings - admin can read/write, authenticated users can read
    match /appSettings/{document} {
      allow read: if request.auth != null;
      // Only super admin can modify the admins list
      allow write: if document == 'admins' ? isSuperAdmin() : isAdmin();
    }
    
    // Analytics - admin and teachers can read, authenticated users can write (for tracking)
    match /analytics/{document} {
      allow read: if isAdmin() || isTeacher();
      allow write: if request.auth != null;
    }
    
    // Update Notifications - admin can create, all authenticated users can read
    match /updateNotifications/{notificationId} {
      allow read: if request.auth != null;
      allow create: if isAdmin();
      allow update, delete: if false;
    }
    
    // Difficulty Presets - authenticated users can read, admin and teachers can write
    match /difficultyPresets/{email} {
      allow read: if request.auth != null;
      allow write: if isAdmin() || isTeacher();
    }
    
    // Bug Reports - users can create and read their own, admin can read/update all
    match /bugReports/{reportId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || isAdmin());
      allow update: if isAdmin();
      allow delete: if false;
      
      match /messages/{messageId} {
        allow read: if request.auth != null && 
          (get(/databases/$(database)/documents/bugReports/$(reportId)).data.userId == request.auth.uid || isAdmin());
        allow create: if request.auth != null && 
          (get(/databases/$(database)/documents/bugReports/$(reportId)).data.userId == request.auth.uid || isAdmin());
        allow update, delete: if false;
      }
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read, write: if isAdmin() || isTeacher();
      
      match /data/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        allow read, write: if isAdmin() || isTeacher();
      }
      
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        allow read, write: if isAdmin() || isTeacher();
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
  admins/                      # Admin email list
    - emails: array            # Array of admin email strings (lowercase)

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

difficultyPresets/
  {normalizedEmail}/           # Pre-assigned difficulty level for email
    - email: string
    - level: string            # 'basic' | 'learning' | 'proficient'
    - createdAt: timestamp
    - updatedBy: string        # Admin email
```
