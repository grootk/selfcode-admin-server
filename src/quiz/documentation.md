# Quiz API Documentation

Base URL: `/v1/quiz`

## Authentication
- All quiz endpoints require a valid JWT token in the `Authorization` header.
- Example: `Authorization: Bearer <token>`

---

## Endpoints

### 1. Get Quiz
- Method: `GET`
- Path: `/v1/quiz/`
- Authentication: Yes

#### Query Parameters
- `topic_id` (string, optional)
- `quiz_id` (string, optional)

#### Responses
- `200 OK` — returns quiz data and metadata.
- `409 Conflict` — no records found or something went wrong.
- `412 Precondition Failed` — server error.

---

### 2. Add Quiz
- Method: `POST`
- Path: `/v1/quiz/`
- Authentication: Yes

#### Request Body
- `title` (string, required)
- `description` (string, optional)
- `chapter_id` (string, optional)
- `topic_id` (string, optional)
- `category_id` (string, optional)
- `sub_category_id` (string, optional)
- `thumbnail` (string, optional)
- `duration` (number, optional)
- `points` (number, optional)
- `start_date` (string/date, optional)
- `end_date` (string/date, optional)
- `questions` (array, optional)
- `difficulty` (string, optional)
- `tags` (array or string, optional)
- `type` (string, optional)

#### Responses
- `201 Created` — quiz created successfully.
- `409 Not Found` — quiz could not be created.
- `412 Precondition Failed` — server error.

---

### 3. Get Quiz Answers
- Method: `GET`
- Path: `/v1/quiz/answer`
- Authentication: Yes

#### Query Parameters
- `quiz_id` (string, required)
- `question_id` (string, required)

#### Responses
- `200 OK` — returns answer details for the specified question.
- `409 Conflict` — no answers found or something went wrong.
- `412 Precondition Failed` — server error.

---

### 4. Update Question Score
- Method: `PATCH`
- Path: `/v1/quiz/answer`
- Authentication: Yes

#### Request Body
- `quiz_id` (string, required)
- `student_id` (string, required)
- `question_id` (string, required)
- `score` (number, required)
- `is_correct` (boolean, required)

#### Responses
- `202 Accepted` — question score updated successfully.
- `409 Not Found` — matching answer not found.
- `412 Precondition Failed` — server error.

---

### 5. Evaluate Quiz / Get Quiz Score
- Method: `GET`
- Path: `/v1/quiz/evaluate`
- Authentication: Yes

#### Query Parameters
- `quiz_id` (string, required)
- `question_id` (string, optional)

#### Responses
- `200 OK` — returns quiz score data and submissions.
- `409 Conflict` — no score data found or something went wrong.
- `412 Precondition Failed` — server error.

---

### 6. Get Quiz Analytics
- Method: `GET`
- Path: `/v1/quiz/analytics`
- Authentication: Yes

#### Query Parameters
- `quiz_id` (string, required)

#### Responses
- `200 OK` — returns quiz analytics and top student rankings.
- `409 Not Found` — analytics data not found.
- `412 Precondition Failed` — server error.
