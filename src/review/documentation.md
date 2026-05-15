# Review API Documentation

Base URL: `/v1/review`

## Authentication
- All review endpoints require a valid JWT token in the `Authorization` header.
- Example: `Authorization: Bearer <token>`

---

## Endpoints

### 1. Get Reviews
- Method: `GET`
- Path: `/v1/review/`
- Authentication: Yes

#### Query Parameters
- `course_id` (string, optional)
- `page` (number, optional)
- `limit` (number, optional)
- `is_testimonial` (boolean, optional)

#### Responses
- `200 OK` — returns reviews with student details.
- `412 Precondition Failed` — server error.

---

### 2. Get Announcements
- Method: `GET`
- Path: `/v1/review/announce`
- Authentication: Yes

#### Query Parameters
- `course_id` (string, optional)
- `sort_by` (string, optional) - supported value: `active`

#### Responses
- `200 OK` — returns announcements and student recipients.
- `412 Precondition Failed` — server error.

---

### 3. Add Announcement
- Method: `POST`
- Path: `/v1/review/announce`
- Authentication: Yes

#### Request Body
- `course_id` (string, required)
- `message` (string, required)
- `status` (string, required)
- `student_id` (string or array, optional)

#### Responses
- `201 Created` — announcement created successfully.
- `412 Precondition Failed` — server error.

---

## Notes
- The `POST /v1/review/` route is currently commented out in route definitions and is not active.
