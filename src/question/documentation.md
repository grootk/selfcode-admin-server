# Question API Documentation

Base URL: `/v1/question`

## Authentication
- All question endpoints require a valid JWT token in the `Authorization` header.
- Example: `Authorization: Bearer <token>`

---

## Endpoints

### 1. Get Questions
- Method: `GET`
- Path: `/v1/question/`
- Authentication: Yes

#### Query Parameters
<!-- - `chapter_id` (string, optional) -->
- `course_id` (string, optional)
- `page` (number, optional)
- `limit` (number, optional)
- `sort_by` (string, optional) - supported values: `learner`, `instructor`

#### Responses
- `200 OK` — returns a list of questions with answer details and like status.
- `412 Precondition Failed` — server error.

---

### 2. Add Question
- Method: `POST`
- Path: `/v1/question/`
- Authentication: Yes

#### Request Body
- `chapter_id` (string, required)
- `question` (string, required)
- `course_id` (string, required)

#### Responses
- `201 Created` — question added successfully.
- `412 Precondition Failed` — server error.

---

### 3. Add Answer
- Method: `POST`
- Path: `/v1/question/answer`
- Authentication: Yes

#### Request Body
- `question_id` (string, required)
- `chapter_id` (string, required)
- `answer` (string, required)
- `course_id` (string, required)

#### Responses
- `201 Created` — answer added successfully.
- `412 Precondition Failed` — server error.
