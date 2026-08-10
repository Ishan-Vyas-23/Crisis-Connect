# CrisisConnect — System Architecture

## 1. Project Overview

CrisisConnect is a real-time emergency coordination platform designed to connect citizens, volunteers, emergency organizations, and administrators during local emergencies.

The platform allows citizens to report emergencies, automatically classify and prioritize incidents, locate nearby resources and volunteers, coordinate responses, and provide real-time updates to affected users.

The system is designed as a modular full-stack web application that can later be extended into a larger disaster-response platform.

---

# 2. Problem Statement

During emergencies, information is often fragmented across phone calls, social media, messaging applications, and different organizations.

This creates several problems:

- Emergency reports may not reach the appropriate responders.
- Authorities may lack a centralized view of ongoing incidents.
- Volunteers may not know where help is required.
- Citizens may not know whether their report has been acknowledged.
- Emergency responders may lack accurate location and routing information.
- Multiple organizations may respond to the same incident while other incidents receive no assistance.
- Changing conditions such as weather can make an incident more dangerous over time.

CrisisConnect provides a centralized platform for reporting, prioritizing, assigning, and monitoring emergency incidents.

---

# 3. Primary Goals

The system should:

1. Allow citizens to report emergencies.
2. Automatically determine incident category and priority.
3. Capture accurate incident location.
4. Display incidents on an interactive map.
5. Allow administrators to verify and manage incidents.
6. Allow volunteers to register their skills and availability.
7. Match appropriate volunteers with incidents.
8. Provide real-time incident status updates.
9. Integrate external services for maps, weather, notifications, storage, and AI.
10. Provide administrators with a real-time operational dashboard.
11. Maintain an auditable history of incident changes and assignments.
12. Be deployable as a production-like MVP.

---

# 4. Non-Goals for the Initial MVP

The first version will NOT attempt to:

- Replace official emergency services.
- Automatically dispatch real-world emergency vehicles.
- Provide guaranteed emergency response.
- Handle national-scale disaster coordination.
- Process real financial transactions.
- Build custom machine-learning models.
- Implement a native mobile application.
- Build a full microservices architecture.

The MVP will focus on coordination, information management, and demonstration of the technical architecture.

---

# 5. User Roles

## 5.1 Citizen

A citizen can:

- Register and log in.
- Manage their profile.
- Report an emergency.
- Attach images to an incident.
- Provide incident location.
- View nearby incidents.
- View their submitted incidents.
- Track incident status.
- Receive notifications.
- View updates related to their incident.

---

## 5.2 Volunteer

A volunteer can:

- Register as a volunteer.
- Maintain their profile.
- Specify skills.
- Set current availability.
- Share approximate/current location when available.
- View suitable incident assignments.
- Accept or reject assignments.
- Update assignment status.
- Receive real-time notifications.

Example skills:

- First Aid
- Swimming
- Driving
- Search and Rescue
- Medical Assistance
- Fire Safety
- Crowd Management

---

## 5.3 Organization

An organization represents an entity capable of coordinating emergency response.

Examples:

- NGO
- Hospital
- Relief organization
- Local response team

Organizations can:

- Create organization profiles.
- Manage members.
- View relevant incidents.
- Coordinate volunteers.
- Manage available resources.

Organization functionality may initially be limited and expanded after the MVP.

---

## 5.4 Administrator

Administrators have system-wide access.

They can:

- View all incidents.
- Verify or reject reports.
- Change incident priority.
- Assign volunteers.
- Monitor active responses.
- Manage users.
- Verify volunteers.
- View system analytics.
- Monitor system activity.
- Access audit logs.

---

# 6. Core Incident Lifecycle

Every incident follows a controlled lifecycle.

```text
REPORTED
    ↓
UNDER_REVIEW
    ↓
VERIFIED
    ↓
ASSIGNED
    ↓
RESPONDING
    ↓
RESOLVED
```

An administrator may reject an incident:

```text
REPORTED
    ↓
UNDER_REVIEW
    ↓
REJECTED
```

An incident may also be cancelled where appropriate.

---

# 7. Incident Categories

Initial categories:

- FIRE
- FLOOD
- ACCIDENT
- MEDICAL
- BUILDING_COLLAPSE
- MISSING_PERSON
- NATURAL_DISASTER
- OTHER

---

# 8. Incident Priority

The system uses four priority levels:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Priority can be determined using:

- User-provided severity.
- AI classification.
- Number of people potentially affected.
- Incident category.
- Environmental conditions.
- Location.
- Administrator review.

AI recommendations must not automatically override administrator decisions.

---

# 9. Functional Architecture

```text
                         ┌───────────────────────┐
                         │       React Client    │
                         │                       │
                         │ Citizen Dashboard     │
                         │ Volunteer Dashboard   │
                         │ Admin Dashboard       │
                         │ Interactive Map       │
                         └───────────┬───────────┘
                                     │
                          HTTPS / REST / WebSocket
                                     │
                         ┌───────────▼───────────┐
                         │    Express Backend    │
                         │                       │
                         │ Routes                │
                         │ Controllers           │
                         │ Services              │
                         │ Middleware            │
                         │ Authentication        │
                         │ Validation            │
                         │ Socket.IO             │
                         └───────────┬───────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
      ┌───────▼───────┐      ┌──────▼───────┐      ┌──────▼───────┐
      │  PostgreSQL   │      │ External APIs│      │   Cloudinary  │
      │               │      │              │      │               │
      │ Users         │      │ Maps         │      │ Incident      │
      │ Incidents     │      │ Weather      │      │ Images        │
      │ Volunteers    │      │ AI           │      │               │
      │ Assignments   │      │ Email        │      │               │
      │ Notifications │      │              │      │               │
      └───────────────┘      └──────────────┘      └───────────────┘
```

---

# 10. Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Recharts
- React Leaflet

## Backend

- Node.js
- Express.js
- Prisma ORM

## Database

- PostgreSQL
- Supabase PostgreSQL for hosted deployment

## Authentication

- JWT
- bcrypt

## Real-Time Communication

- Socket.IO

## External Services

- Maps/geocoding/routing API
- Weather API
- AI API
- Cloudinary
- Email delivery service

## Development

- Git
- GitHub
- Postman
- ESLint

## Deployment

- Vercel for frontend
- Render for backend
- Supabase for PostgreSQL

---

# 11. Repository Structure

```text
crisis-connect/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── routes/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── sockets/
│   │   ├── lib/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   └── package.json
│
├── docs/
│   └── ARCHITECTURE.md
│
├── .env.example
├── .gitignore
└── README.md
```

---

# 12. Database Design

The database will use PostgreSQL.

## 12.1 User

```text
User
----
id
name
email
passwordHash
phone
role
isVerified
createdAt
updatedAt
```

Roles:

```text
CITIZEN
VOLUNTEER
ORGANIZATION_ADMIN
ADMIN
```

---

## 12.2 Volunteer

```text
Volunteer
---------
id
userId
availabilityStatus
latitude
longitude
verificationStatus
createdAt
updatedAt
```

Availability:

```text
AVAILABLE
BUSY
OFFLINE
```

---

## 12.3 Skill

```text
Skill
-----
id
name
```

---

## 12.4 VolunteerSkill

Many-to-many relationship:

```text
VolunteerSkill
--------------
volunteerId
skillId
```

---

## 12.5 Incident

```text
Incident
--------
id
reportedBy
title
description
category
priority
status
latitude
longitude
address
aiClassification
aiConfidence
peopleAtRisk
createdAt
updatedAt
resolvedAt
```

---

## 12.6 IncidentMedia

```text
IncidentMedia
-------------
id
incidentId
url
publicId
mediaType
createdAt
```

---

## 12.7 IncidentAssignment

```text
IncidentAssignment
------------------
id
incidentId
volunteerId
assignedBy
status
matchScore
assignedAt
acceptedAt
completedAt
```

Assignment statuses:

```text
PENDING
ACCEPTED
REJECTED
RESPONDING
COMPLETED
```

---

## 12.8 IncidentUpdate

Stores the incident timeline.

```text
IncidentUpdate
--------------
id
incidentId
userId
oldStatus
newStatus
message
createdAt
```

---

## 12.9 Notification

```text
Notification
------------
id
userId
type
title
message
isRead
createdAt
```

---

## 12.10 Organization

```text
Organization
------------
id
name
description
contactEmail
contactPhone
address
latitude
longitude
verificationStatus
createdAt
updatedAt
```

---

## 12.11 OrganizationMember

```text
OrganizationMember
------------------
organizationId
userId
role
createdAt
```

---

## 12.12 AuditLog

```text
AuditLog
--------
id
userId
action
entityType
entityId
metadata
createdAt
```

---

# 13. Important Relationships

```text
User
 │
 ├───────────────┐
 │               │
 ▼               ▼
Volunteer      Incident
 │               │
 │               ├── IncidentMedia
 │               ├── IncidentUpdate
 │               └── IncidentAssignment
 │                       │
 └── VolunteerSkill      │
         │               │
         ▼               ▼
       Skill          Volunteer
```

Additional:

```text
User
 │
 └── Notification

Organization
 │
 └── OrganizationMember
          │
          ▼
         User
```

---

# 14. API Architecture

All APIs use:

```text
/api
```

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

---

## Users

```text
GET   /api/users/me
PATCH /api/users/me
```

Admin:

```text
GET   /api/admin/users
PATCH /api/admin/users/:id
```

---

## Incidents

```text
POST   /api/incidents
GET    /api/incidents
GET    /api/incidents/:id
PATCH  /api/incidents/:id
DELETE /api/incidents/:id
```

Filtering:

```text
/api/incidents?status=VERIFIED
/api/incidents?priority=CRITICAL
/api/incidents?category=FLOOD
```

Geographic filtering may later support:

```text
/api/incidents/nearby
```

---

## Incident Updates

```text
GET  /api/incidents/:id/updates
POST /api/incidents/:id/updates
```

---

## Volunteers

```text
POST  /api/volunteers
GET   /api/volunteers/me
PATCH /api/volunteers/me
PATCH /api/volunteers/availability
PATCH /api/volunteers/location
GET   /api/volunteers/nearby
```

---

## Skills

```text
GET  /api/skills
POST /api/volunteers/me/skills
DELETE /api/volunteers/me/skills/:skillId
```

---

## Assignments

```text
POST  /api/incidents/:id/assign
GET   /api/assignments
PATCH /api/assignments/:id
```

---

## Notifications

```text
GET   /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

---

## Organizations

```text
POST  /api/organizations
GET   /api/organizations
GET   /api/organizations/:id
PATCH /api/organizations/:id
POST  /api/organizations/:id/members
DELETE /api/organizations/:id/members/:userId
```

---

# 15. Authentication Architecture

The authentication system uses JWT-based authentication.

Flow:

```text
Client
   │
   │ email + password
   ▼
POST /auth/login
   │
   ▼
Express
   │
   ├── Validate credentials
   │
   ├── Compare password hash
   │
   └── Generate tokens
          │
          ├── Access Token
          └── Refresh Token
```

The access token is used for authenticated API requests.

Protected requests:

```text
Request
   ↓
Authentication Middleware
   ↓
Validate JWT
   ↓
Attach user to request
   ↓
Authorization Middleware
   ↓
Controller
```

Role-based access:

```text
requireAuth()
requireRole("ADMIN")
requireRole("VOLUNTEER")
```

---

# 16. AI Incident Classification

When an incident is submitted:

```text
Citizen Report
      ↓
Incident API
      ↓
AI Classification Service
      ↓
Category
Priority Recommendation
Resources Required
People At Risk
Confidence
      ↓
PostgreSQL
```

Example:

```json
{
  "category": "FLOOD",
  "priority": "HIGH",
  "peopleAtRisk": true,
  "requiredSkills": ["SWIMMING", "FIRST_AID"],
  "confidence": 0.91
}
```

AI output is treated as a recommendation.

Administrators retain authority to change the final category and priority.

The AI service must not be treated as a replacement for emergency professionals.

---

# 17. External API Architecture

External services should be accessed through dedicated backend service modules.

The frontend should NOT directly expose secret API keys.

Example:

```text
React
  ↓
Express
  ↓
services/
  ├── mapsService.js
  ├── weatherService.js
  ├── aiService.js
  ├── notificationService.js
  └── storageService.js
```

---

# 18. Maps Integration

Maps functionality will provide:

- Incident locations.
- Volunteer locations where permitted.
- Hospital/resource locations.
- Reverse geocoding.
- Distance calculation.
- Route calculation.

Flow:

```text
Latitude + Longitude
        ↓
Maps API
        ↓
Address / Route / Distance
        ↓
Backend
        ↓
React Map
```

Location information should only be exposed to users who are authorized to see it.

---

# 19. Weather Integration

Weather information may be associated with an incident.

Example:

```text
Incident
   ↓
Coordinates
   ↓
Weather API
   ↓
Current conditions
   ↓
Risk assessment
```

Relevant information may include:

- Temperature
- Rainfall
- Wind speed
- Humidity
- Weather condition

Weather information can be used as an additional signal when prioritizing incidents.

---

# 20. File Upload Architecture

Incident images are uploaded using multipart/form-data.

```text
React
  ↓
Express
  ↓
Validation
  ↓
Cloudinary
  ↓
Image URL
  ↓
PostgreSQL
```

The database stores metadata and URLs rather than binary image files.

Uploads must validate:

- File type
- File size
- Number of files

---

# 21. Real-Time Architecture

Socket.IO will be used for real-time communication.

Potential events:

```text
incident:created
incident:updated
incident:verified
incident:assigned
incident:status_changed

assignment:created
assignment:accepted
assignment:rejected

notification:new

volunteer:availability_changed
```

Example:

```text
Admin verifies incident
        ↓
Backend
        ↓
Database update
        ↓
Socket.IO event
        ↓
Connected clients
        ↓
UI updates without refresh
```

---

# 22. Socket Rooms

Potential room structure:

```text
incident:{incidentId}
user:{userId}
organization:{organizationId}
admin
```

For example:

```text
incident:392
```

Users monitoring incident 392 can receive real-time updates for that incident.

---

# 23. Volunteer Matching

The volunteer matching system produces a match score.

Potential factors:

```text
Skill Match       → 40%
Distance          → 30%
Availability      → 20%
Experience         → 10%
```

Example:

```text
Volunteer A

Skill match:      95%
Distance:         82%
Availability:    100%
Experience:       80%

Final Score:      90.3%
```

The exact weighting should remain configurable.

The first version will implement a deterministic scoring algorithm rather than machine learning.

---

# 24. Notification Architecture

Notifications can be generated from important system events.

```text
System Event
     ↓
Notification Service
     ├── In-app / Socket.IO
     └── Email
```

Optional future channels:

```text
SMS
Push Notifications
```

Examples:

- Incident verified.
- Volunteer assigned.
- Assignment accepted.
- Incident status changed.
- Emergency update published.

---

# 25. Admin Dashboard

The admin dashboard should provide:

### Overview

- Total incidents.
- Active incidents.
- Critical incidents.
- Resolved incidents.
- Available volunteers.

### Map

- Live incident locations.
- Incident severity.
- Incident status.

### Incident Management

- Incident list.
- Filters.
- Incident details.
- Timeline.
- Assignment management.

### Volunteer Management

- Volunteer list.
- Availability.
- Skills.
- Verification status.
- Location.

### Analytics

- Incidents by category.
- Incidents by priority.
- Average response time.
- Resolution rate.
- Geographic distribution.

---

# 26. Security Requirements

The backend must implement:

- Password hashing using bcrypt.
- JWT authentication.
- Role-based authorization.
- Input validation.
- Request body validation.
- Rate limiting on sensitive endpoints.
- Secure HTTP headers.
- CORS configuration.
- Environment variables for secrets.
- File upload validation.
- Parameterized database queries through Prisma.
- Proper error handling.
- Audit logging for sensitive administrative operations.

Sensitive information must never be committed to Git.

---

# 27. Error Handling

The backend will use centralized error handling.

Expected structure:

```text
Request
   ↓
Route
   ↓
Controller
   ↓
Service
   ↓
Database / External API
   ↓
Error
   ↓
Central Error Middleware
   ↓
Consistent JSON response
```

Example response:

```json
{
  "success": false,
  "message": "Incident not found",
  "code": "INCIDENT_NOT_FOUND"
}
```

The server must not expose internal stack traces in production responses.

---

# 28. Validation

Validation should occur before business logic.

Validate:

- Email.
- Password.
- Phone.
- Coordinates.
- Incident category.
- Incident priority.
- Incident description.
- Uploaded files.
- Pagination parameters.
- Query parameters.

The exact validation library will be selected during implementation.

---

# 29. Logging and Monitoring

The server should log:

- Request errors.
- Authentication failures.
- External API failures.
- Database errors.
- Important administrative actions.

Production logs must not contain:

- Passwords.
- JWT secrets.
- API keys.
- Sensitive personal information.

---

# 30. Testing Strategy

Testing will initially focus on critical business logic.

## Unit Tests

- Volunteer matching.
- Priority calculation.
- Validation.
- Utility functions.

## Integration Tests

- Authentication.
- Incident creation.
- Authorization.
- Assignment.
- Incident lifecycle.

## Manual Testing

Postman will be used during development to test APIs.

---

# 31. Deployment Architecture

```text
                    GitHub
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
          Vercel              Render
             │                   │
             ▼                   ▼
          React UI          Express API
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
             Supabase        Cloudinary       External APIs
             PostgreSQL       Images          Maps/AI/Weather
```

Environment variables must be configured separately for development and production.

---

# 32. Environment Variables

Example:

```text
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=

MAPS_API_KEY=
WEATHER_API_KEY=
AI_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_API_KEY=

CLIENT_URL=
SERVER_URL=
```

No real secrets should ever be committed to the repository.

---

# 33. Development Strategy

Development will follow vertical feature slices rather than building the entire backend and frontend independently.

Example:

```text
Authentication
    ↓
Backend API
    ↓
Frontend Login
    ↓
Protected Dashboard
```

Then:

```text
Incident Creation
    ↓
Backend
    ↓
Database
    ↓
Frontend Form
    ↓
Map
```

Then:

```text
Volunteer Matching
    ↓
Assignment
    ↓
Socket.IO
    ↓
Real-Time UI
```

Each feature should be tested before moving to the next major feature.

---

# 34. MVP Development Order

## Phase 1 — Foundation

- Repository setup.
- React/Vite setup.
- Express setup.
- PostgreSQL setup.
- Prisma setup.
- Environment configuration.
- Basic folder structure.

## Phase 2 — Authentication

- Registration.
- Login.
- JWT.
- Refresh tokens.
- Authentication middleware.
- RBAC.
- Protected frontend routes.

## Phase 3 — Incidents

- Incident schema.
- Incident API.
- Incident creation.
- Incident listing.
- Incident details.
- Incident status lifecycle.

## Phase 4 — Frontend

- Authentication UI.
- Citizen dashboard.
- Incident report form.
- Incident details.
- Map view.

## Phase 5 — External APIs

- Geocoding.
- Weather.
- Routing.
- AI classification.

## Phase 6 — Volunteers

- Volunteer profile.
- Skills.
- Availability.
- Location.
- Matching algorithm.
- Assignment workflow.

## Phase 7 — Real-Time

- Socket.IO.
- Incident rooms.
- Assignment events.
- Real-time notifications.

## Phase 8 — Notifications and Media

- Cloudinary.
- Email notifications.
- In-app notifications.

## Phase 9 — Admin Dashboard

- Incident management.
- Volunteer management.
- Live map.
- Analytics.
- Audit logs.

## Phase 10 — Hardening

- Validation.
- Security.
- Error handling.
- Testing.
- Performance improvements.

## Phase 11 — Deployment

- Frontend deployment.
- Backend deployment.
- Database deployment.
- Environment configuration.
- Production testing.

---

# 35. Future Improvements

Potential future features:

- Native mobile application.
- Push notifications.
- SMS emergency alerts.
- Hospital capacity tracking.
- Emergency vehicle tracking.
- Resource inventory management.
- Organization-to-organization coordination.
- Advanced geospatial queries.
- Predictive incident analysis.
- Offline-first mobile reporting.
- Computer vision for uploaded incident images.
- Multi-language support.
- Large-scale event/disaster mode.
- Dedicated emergency authority integrations.

---

# 36. Architectural Principles

The project should follow these principles:

### Separation of Concerns

Routes, controllers, services, database access, and external APIs should have clearly defined responsibilities.

### Security by Default

Authentication and authorization should be applied explicitly to protected operations.

### External API Isolation

Third-party APIs should only be accessed through backend service modules.

### Small, Testable Services

Business logic should not be buried inside Express route handlers.

### Real-Time Events After Successful State Changes

Socket events should be emitted only after the corresponding database operation succeeds.

### AI as an Assistant

AI-generated classifications and recommendations should be treated as suggestions rather than unquestionable truth.

### MVP First

Features should be implemented in a working vertical slice before adding advanced functionality.

### Observable System

Important operations should be logged and auditable.

---

# 37. Definition of Done

The MVP is considered complete when:

- A citizen can register and log in.
- A citizen can report an incident.
- Incident location is stored and displayed on a map.
- Incident status can be managed.
- AI can classify an incident.
- Weather information can be retrieved for an incident.
- Volunteers can register and define skills.
- Volunteers can set availability.
- The system can recommend suitable volunteers.
- An administrator can assign a volunteer.
- The volunteer receives the assignment in real time.
- Incident status changes appear in real time.
- Incident images can be uploaded.
- Users receive notifications.
- Administrators can monitor the system through a dashboard.
- The application is deployed.
- Critical APIs have automated tests.
- No secrets are committed to Git.

---

# 38. Initial Architecture Decision

The project will begin as a **modular monolith**.

The backend will remain a single Node.js/Express application with clearly separated modules.

```text
server
│
├── auth
├── users
├── incidents
├── volunteers
├── assignments
├── notifications
├── organizations
├── integrations
└── admin
```

Microservices will NOT be introduced during the MVP.

The architecture should remain modular enough that individual modules could later be extracted into independent services if scale requires it.

---

# 39. Architecture Review Requirement

Before implementation begins, the architecture should be reviewed for:

- Missing requirements.
- Incorrect relationships.
- Security weaknesses.
- Unnecessary complexity.
- Scalability bottlenecks.
- External API risks.
- Poor separation of concerns.
- Database design problems.
- Real-time architecture problems.
- Deployment issues.

The architecture should be revised before significant implementation begins.
