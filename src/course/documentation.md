# Course API Documentation

Base URL: `/v1/course`

## Authentication
- All course endpoints require a valid JWT token in the `Authorization` header.
- Example: `Authorization: Bearer <token>`

---

## Endpoints

### 1. Get Courses
- Method: `GET`
- Path: `/v1/course/`
- Authentication: Yes

#### Query Parameters
- `page` (number, optional)
- `limit` (number, optional)
- `search` (string, optional)
- `status` (string, optional) - e.g. `published`, `draft`
- `sort_by` (string, optional) -e.g. 'top',
- `monthFilter` (string or number, optional) -"january","frbruary"
- `yearFilter` (string or number, optional) "2024'

#### Responses
- `200 OK` — returns paginated course list.
- `409 Conflict` — no records found or something went wrong.
- `412 Precondition Failed` — server error.

---

### 2. Get Course Detail
- Method: `GET`
- Path: `/v1/course/detail`
- Authentication: Yes

#### Query Parameters
- `course_id` (string, required)

#### Responses
- `200 OK` — returns course details.
- `412 Precondition Failed` — server error.

---

### 3. Add Course
- Method: `POST`
- Path: `/v1/course/`
- Authentication: Yes

#### Request Body
- `category_id` (string, required)
- `sub_category_id` (string, optional)
- `title` (string, required)
- `description` (string, optional)
- `overview` (string, optional)
- `price` (number, optional)
- `discount` (number, optional)
- `thumbnail` (string, optional)
- `promovideo` (string, optional)
- `status` (string, optional)
- `skill` (string or array, optional)
- `promotinal` (boolean or string, optional)
- `coupons` (array, optional)
- `promotinal_coupons` (array, optional)

#### Responses
- `200 OK` — course created successfully.
- `412 Precondition Failed` — server error.

---

### 4. Update Course
- Method: `PATCH`
- Path: `/v1/course/`
- Authentication: Yes

#### Request Body
- `course_id` (string, required)
- `category_id` (string, optional)
- `subcategory_id` (string, optional)
- `title` (string, optional)
- `description` (string, optional)
- `overview` (string, optional)
- `price` (number, optional)
- `discount` (number, optional)
- `tags` (array or string, optional)
- `level` (string, optional)
- `language` (string, optional)
- `thumbnail` (string, optional)
- `promovideo` (string, optional)
- `status` (string, optional)
- `skill` (string or array, optional)

#### Responses
- `200 OK` — course updated successfully.
- `412 Precondition Failed` — server error.

---

### 5. Delete Course
- Method: `DELETE`
- Path: `/v1/course/`
- Authentication: Yes

#### Query Parameters
- `course_id` (string, required)

#### Responses
- `200 OK` — course deleted successfully.
- `412 Precondition Failed` — server error.

---

### 6. Get Chapter and Topics
- Method: `GET`
- Path: `/v1/course/chapter`
- Authentication: Yes

#### Query Parameters
- `page` (number, optional)
- `limit` (number, optional)
- `course_id` (string, required)

#### Responses
- `200 OK` — returns chapter and topic list for the course.
- `412 Precondition Failed` — server error.

---

### 7. Get All Chapters
- Method: `GET`
- Path: `/v1/course/chapter/all`
- Authentication: Yes

#### Query Parameters
- `page` (number, optional)
- `limit` (number, optional)
- `course_id` (string, required)

#### Responses
- `201 Created` — returns the list of chapters.
- `409 Not Found` — no chapters found.
- `412 Precondition Failed` — server error.

---

### 8. Add Chapter
- Method: `POST`
- Path: `/v1/course/chapter`
- Authentication: Yes

#### Request Body
- `course` (array of chapter objects, required)

Chapter object fields may include:
- `course_id` (string, required)
- `chapter_id` (string, optional for existing chapters)
- `chapter_title` (string, required)
- `chapter_rank` (number, optional)
- `chapter_duration` (number, optional)
- `topics` (array, optional)

Topic object fields may include:
- `topic_id` (string, optional)
- `topic_title` (string, required)
- `topic_duration` (number, optional)
- `topic_type` (string, optional)
- `video_url` (string, optional)
- `quiz_id` (string, optional)

#### Responses
- `200 OK` — chapter and topic content saved successfully.
- `412 Precondition Failed` — server error.

---

### 9. Update Chapter
- Method: `PATCH`
- Path: `/v1/course/chapter`
- Authentication: Yes

#### Request Body
- `course` (array of chapter objects, required)

Each chapter object can include:
- `chapter_id` (string)
- `course_id` (string)
- `chapter_title` (string)
- `chapter_rank` (number)
- `chapter_duration` (number)
- `is_added` (boolean)
- `is_updated` (boolean)
- `topics` (array)

Topic object fields can include:
- `topic_id` (string)
- `topic_title` (string)
- `topic_rank` (number)
- `topic_duration` (number)
- `topic_type` (string)
- `video_url` (string)
- `quiz_id` (string)
- `is_free_preview` (boolean)
- `is_added` (boolean)

#### Responses
- `202 Accepted` — chapter/topic updates saved successfully.
- `409 Not Found` — no chapter or topic updated.
- `412 Precondition Failed` — server error.

---

### 10. Delete Chapter
- Method: `DELETE`
- Path: `/v1/course/chapter`
- Authentication: Yes

#### Query Parameters
- `chapter_id` (string, required)
- `course_id` (string, required)

#### Responses
- `202 Accepted` — chapter deleted successfully.
- `409 Not Found` — chapter not found.
- `412 Precondition Failed` — server error.

---

### 11. Get Topics
- Method: `GET`
- Path: `/v1/course/topic`
- Authentication: Yes

#### Query Parameters
- `chapter_id` (string, required)
- `page` (number, optional)
- `limit` (number, optional)

#### Responses
- `200 OK` — returns topic list.
- `409 Not Found` — topic not found.
- `412 Precondition Failed` — server error.

---

### 12. Add Topic
- Method: `POST`
- Path: `/v1/course/topic`
- Authentication: Yes

#### Request Body
- `chapter_id` (string, required)
- `course_id` (string, required)
- `title` (string, optional)
- `rank` (number, optional)
- `video_url` (string, optional)
- `duration` (number, optional)
- `type` (string, optional)
- `quiz_id` (string, optional)
- `is_preview` (boolean, optional)

#### Responses
- `201 Created` — topic created successfully.
- `409 Not Found` — topic could not be created.
- `412 Precondition Failed` — server error.

---

### 13. Update Topic
- Method: `PATCH`
- Path: `/v1/course/topic`
- Authentication: Yes

#### Request Body
- `topic_id` (string, required)
- `chapter_id` (string, optional)
- `course_id` (string, optional)
- `title` (string, optional)
- `rank` (number, optional)
- `video_url` (string, optional)
- `duration` (number, optional)
- `type` (string, optional)
- `quiz_id` (string, optional)
- `is_preview` (boolean, optional)

#### Responses
- `202 Accepted` — topic updated successfully.
- `409 Not Found` — topic not found.
- `412 Precondition Failed` — server error.

---

### 14. Delete Topic
- Method: `DELETE`
- Path: `/v1/course/topic`
- Authentication: Yes

#### Query Parameters
- `topic_id` (string, required)
- `chapter_id` (string, optional)
- `duration` (number, optional)

#### Responses
- `202 Accepted` — topic deleted successfully.
- `409 Not Found` — topic not found.
- `412 Precondition Failed` — server error.

---

### 15. Add Favourite
- Method: `POST`
- Path: `/v1/course/favourite`
- Authentication: Yes

#### Request Body
- `question_id` (string, required)
- `favourite` (boolean, required)

#### Responses
- `201 Created` — favourite saved successfully.
- `409 Not Found` — favourite could not be saved.
- `412 Precondition Failed` — server error.

---

### 16. Get Course Students
- Method: `GET`
- Path: `/v1/course/student`
- Authentication: Yes

#### Query Parameters
- `course_id` (string, required)
- `page` (number, optional)
- `limit` (number, optional)
- `monthFilter` (string or number, optional)
- `search` (string, optional)

#### Responses
- `200 OK` — returns enrolled students and progress metrics.
- `409 Not Found` — no students found.
- `412 Precondition Failed` — server error.

---

### 17. Get Quiz Analytics
- Method: `GET`
- Path: `/v1/course/analytics`
- Authentication: Yes

#### Query Parameters
- `course_id` (string, required)

#### Responses
- `200 OK` — returns quiz analytics for the course.
- `409 Not Found` — analytics data not found.
- `412 Precondition Failed` — server error.
