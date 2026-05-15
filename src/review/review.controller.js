const reviewService = require("./review.service");
const { successHandler, errorHandler } = require("../../packages/handlers");

const getReview = async (req, res, next) => {
  try {
    const { course_id, page, limit, sort_by, student_id, search } = req.query;
    const data = await reviewService.getReview(
      course_id,
      page,
      limit,
      sort_by,
      student_id,
      search
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

// const addReview = async (req, res, next) => {
//     try {
//         const instructor_id = req.data.sub;
//         const { instructor_id, course_id, rating, feedback } = req.body;
//         const data = await reviewService.addReview(
//             student_id, instructor_id, course_id, rating, feedback
//         );
//         return successHandler(data, req, res, next);
//     } catch (error) {
//         return errorHandler(
//             {
//                 status: 412,
//                 message: error.message,
//                 data: [],
//             },
//             req,
//             res,
//             next
//         );
//     }
// }

const pinReview = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { review_id, course_id, is_testimonial } = req.body;
    const data = await reviewService.pinReview(
      review_id,
      instructor_id,
      is_testimonial,
      course_id
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const getAnnouncement = async (req, res, next) => {
  try {
    const { course_id, sort_by, page, limit, search } = req.query;
    const data = await reviewService.getAnnouncement(
      course_id,
      sort_by,
      page,
      limit,
      search
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const getAnnouncementDetail = async (req, res, next) => {
  try {
    const { announcement_id } = req.query;
    const data = await reviewService.getAnnouncementDetail(announcement_id);
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const addAnnouncement = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { course_id, message, subject, status, student_id } = req.body;
    const data = await reviewService.addAnnouncement(
      instructor_id,
      course_id,
      message,
      subject,
      status,
      student_id
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { announcement_id, course_id, message, subject, status, student_id } =
      req.body;
    const data = await reviewService.updateAnnouncement(
      announcement_id,
      instructor_id,
      course_id,
      message,
      subject,
      status,
      student_id
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    // const instructor_id = req.data.sub;
    const { announcement_id } = req.query;
    const data = await reviewService.deleteAnnouncement(announcement_id);
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

module.exports = {
  getReview,
  // addReview,
  pinReview,
  getAnnouncement,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementDetail,
};
