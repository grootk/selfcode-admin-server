# Instructor API Documentation

Base URL: `/v1/instructor`

## Authentication
- Protected endpoints require a valid JWT token in the `Authorization` header.
- Example: `Authorization: Bearer <token>`

---

## Endpoints

### 1. Sign Up
- Method: `POST`
- Path: `/v1/instructor/signup`
- Authentication: No

#### Request Body
- `first_name` (string, required)
- `last_name` (string, required)
- `email` (string, required)
- `password` (string, required)
- `phone_no` (string, optional)
- `avatar` (string, optional)
- `gender` (string, optional)
- `about` (string, optional)
- `country` (string, optional)
- `state` (string, optional)
- `work_experience` (string, optional)
- `current_profile` (string, optional)
- `social_media` (object or string, optional)
- `role` (string, optional)

#### Responses
- `201 Created` — instructor created successfully.
- `409 Conflict` — email or phone already exists.
- `500 Internal Server Error` — server or database error.

---

### 2. Login
- Method: `POST`
- Path: `/v1/instructor/login`
- Authentication: No

#### Request Body
- `email` (string, required)
- `password` (string, required)

#### Responses
- `200 OK` — login successful; returns `accessToken`, `idToken`, `refreshToken`.
- `401 Unauthorized` — authentication failed.
- `500 Internal Server Error` — server error.

---

### 3. Request Password Reset
- Method: `POST`
- Path: `/v1/instructor/reset`
- Authentication: No

#### Request Body
- `email` (string, required)
- `phone_no` (string, optional)

#### Responses
- `200 OK` — reset email / OTP sent successfully.
- `409 Bad Request` — instructor not found.
- `500 Internal Server Error` — email sending failed.
- `412 Precondition Failed` — unexpected server error in controller catch.

---

### 4. Verify OTP
- Method: `PATCH`
- Path: `/v1/instructor/verify`
- Authentication: No

#### Request Body
- `email` (string, required)
- `otp` (string, required)

#### Responses
- `200 OK` — OTP verified successfully.
- `409 Not Found` — OTP did not match or verification failed.
- `422 Unprocessable Entity` — verification error.
- `412 Precondition Failed` — unexpected server error in controller catch.

---

### 5. Change Password
- Method: `PATCH`
- Path: `/v1/instructor/password`
- Authentication: No

#### Request Body
- `email` (string, required)
- `password` (string, required)

#### Responses
- `200 OK` — password changed successfully.
- `409 Not Found` — instructor not found.
- `409 Not Found` — password change could not be confirmed.
- `422 Unprocessable Entity` — server validation or update error.
- `412 Precondition Failed` — unexpected server error in controller catch.

---

### 6. Get Instructor Profile
- Method: `GET`
- Path: `/v1/instructor`
- Authentication: Yes

#### Query Parameters
- None

#### Responses
- `200 OK` — returns the authenticated instructor's profile.
- `409 Conflict` — profile not found or something went wrong.
- `500 Internal Server Error` — server error.

---

### 7. Update Instructor Profile
- Method: `PATCH`
- Path: `/v1/instructor`
- Authentication: Yes

#### Request Body
- `first_name` (string, optional)
- `last_name` (string, optional)
- `phone_no` (string, optional)
- `avatar` (string, optional)
- `gender` (string, optional)
- `about` (string, optional)
- `country` (string, optional)
- `state` (string, optional)
- `work_experience` (string, optional)
- `current_profile` (string, optional)
- `social_media` (object or string, optional)

#### Responses
- `200 OK` — profile updated successfully.
- `409 Conflict` — update failed.
- `500 Internal Server Error` — server error.

---

### 8. Get Revenue
- Method: `GET`
- Path: `/v1/instructor/revenue`
- Authentication: Yes

#### Query Parameters
- `page` (number, optional)
- `limit` (number, optional)

#### Responses
- `200 OK` — returns revenue data.
- `409 Not Found` — revenue data not found.
- `422 Unprocessable Entity` — query error.

---

### 9. Get Activity
- Method: `GET`
- Path: `/v1/instructor/activity`
- Authentication: Yes

#### Query Parameters
- `page` (number, optional)
- `limit` (number, optional)
- `monthFilter` (string or number, optional)
- `yearFilter` (string or number, optional)

#### Responses
- `200 OK` — returns activity data.
- `409 Not Found` — activity data not found.
- `422 Unprocessable Entity` — query error.

---

### 10. Get Analytics / Monthly Stats
- Method: `GET`
- Path: `/v1/instructor/analytics`
- Authentication: Yes

#### Query Parameters
- `month` (string or number, optional)
- `year` (string or number, optional)

#### Responses
- `200 OK` — returns monthly statistics.
- `409 Bad Request` — invalid month name.
- `409 Not Found` — no courses found.
- `412 Precondition Failed` — unexpected server error.
