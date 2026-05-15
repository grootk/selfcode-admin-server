const courseService = require("./course.service");
const { successHandler, errorHandler } = require("../../packages/handlers");

const getAllCourses = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { page, limit, search } = req.query;
    const data = await courseService.getAllCourses(
      instructor_id,
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

const getCourse = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { page, limit, search, status, sort_by, monthFilter, yearFilter } =
      req.query;
    const data = await courseService.getCourse(
      instructor_id,
      page,
      limit,
      search,
      status, //"published", "draft"
      sort_by,
      monthFilter,
      yearFilter
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

const addCourse = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const {
      category_id,
      sub_category_id,
      title,
      description,
      overview,
      price,
      discount,
      thumbnail,
      promovideo,
      status,
      skill,
      promotinal,
      coupons,
      promotinal_coupons,
      price_type,
    } = req.body;
    const data = await courseService.addCourse(
      category_id,
      sub_category_id,
      title,
      description,
      overview,
      instructor_id,
      price,
      discount,
      thumbnail,
      promovideo,
      status,
      skill,
      promotinal,
      coupons,
      promotinal_coupons,
      price_type
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: err.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const {
      course_id,
      category_id,
      subcategory_id,
      title,
      description,
      overview,
      price,
      discount,
      tags,
      level,
      language,
      thumbnail,
      promovideo,
      status,
      skill,
      promotinal,
      coupons,
      promotinal_coupons,
      price_type,
    } = req.body;
    const data = await courseService.updateCourse(
      course_id,
      category_id,
      subcategory_id,
      title,
      description,
      overview,
      instructor_id,
      price,
      discount,
      tags,
      level,
      language,
      thumbnail,
      promovideo,
      status,
      skill,
      promotinal,
      coupons,
      promotinal_coupons,
      price_type
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: err.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { course_id } = req.query;
    const data = await courseService.deleteCourse(course_id, instructor_id);
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

const getCourseDetail = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { course_id } = req.query;
    const data = await courseService.getCourseDetail(course_id, instructor_id);
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

const getChapterAndTopics = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { page, limit, course_id } = req.query;
    const data = await courseService.getChapterAndTopics(
      instructor_id,
      page,
      limit,
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

const getAllChapter = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { page, limit, course_id } = req.query;
    const data = await courseService.getAllChapter(
      instructor_id,
      page,
      limit,
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

// const addChapter = async (req, res, next) => {
//   try {
//     const { course_id, title, rank } = req.body;
//     const data = await courseService.addChapter(course_id, title, rank);
//     return successHandler(data, req, res, next);
//   } catch (error) {
//     return errorHandler(
//       {
//         status: 412,
//         message: err.message,
//         data: [],
//       },
//       req,
//       res,
//       next
//     );
//   }
// };
const addChapter = async (req, res, next) => {
  try {
    const { course } = req.body;
    const data = await courseService.addChapter(course);
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

const updateChapter = async (req, res, next) => {
  try {
    const payload = req.body;
    // const { chapter_id, course_id, title, description, rank } = req.body;
    const data = await courseService.updateChapter(payload);
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: err.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const deleteChapter = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { chapter_id, course_id } = req.query;
    const data = await courseService.deleteChapter(chapter_id, course_id);
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

const getTopic = async (req, res, next) => {
  try {
    const { chapter_id, page, limit } = req.query;
    const data = await courseService.getTopic(chapter_id, page, limit);
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

const addTopic = async (req, res, next) => {
  try {
    const {
      chapter_id,
      course_id,
      title,
      rank,
      video_url,
      duration,
      type,
      quiz_id,
      is_preview,
    } = req.body;
    const data = await courseService.addTopic(
      chapter_id,
      course_id,
      title,
      rank,
      video_url,
      duration,
      type,
      quiz_id,
      is_preview
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: err.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const updateTopic = async (req, res, next) => {
  try {
    const {
      topic_id,
      chapter_id,
      course_id,
      title,
      rank,
      video_url,
      duration,
      type,
      quiz_id,
      is_preview,
    } = req.body;
    const data = await courseService.updateTopic(
      topic_id,
      chapter_id,
      course_id,
      title,
      rank,
      video_url,
      duration,
      type,
      quiz_id,
      is_preview
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: err.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    const { topic_id, chapter_id, duration } = req.query;
    const data = await courseService.deleteTopic(
      topic_id,
      chapter_id,
      duration
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

const addFavourite = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { question_id, favourite } = req.body;
    const data = await courseService.addFavourite(
      instructor_id,
      question_id,
      favourite
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

const getStudent = async (req, res, next) => {
  try {
    const { course_id, page, limit, monthFilter, yearFilter, search } =
      req.query;
    const data = await courseService.getStudent(
      course_id,
      page,
      limit,
      monthFilter,
      yearFilter,
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

// const getQuizAnalytics = async (req, res, next) => {
//   try {
//     const instructor_id = req.data.sub;
//     const { course_id } = req.query;
//     const data = await courseService.getQuizAnalytics(instructor_id, course_id);
//     return successHandler(data, req, res, next);
//   } catch (error) {
//     return errorHandler(
//       {
//         status: 412,
//         message: error.message,
//         data: [],
//       },
//       req,
//       res,
//       next
//     );
//   }
// };

module.exports = {
  getAllCourses,
  getCourse,
  addCourse,
  updateCourse,
  deleteCourse,
  getCourseDetail,

  getAllChapter,
  getChapterAndTopics,
  addChapter,
  updateChapter,
  deleteChapter,

  getTopic,
  addTopic,
  updateTopic,
  deleteTopic,

  addFavourite,
  getStudent,
  // getQuizAnalytics,
};
