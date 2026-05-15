const quizService = require("./quiz.service");
const { successHandler, errorHandler } = require("../../packages/handlers");

const getQuiz = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const {
      page,
      limit,
      topic_id,
      quiz_id,
      sort_by,
      monthFilter,
      yearFilter,
      search,
    } = req.query;
    const data = await quizService.getQuiz(
      page,
      limit,
      topic_id,
      quiz_id,
      instructor_id,
      sort_by,
      monthFilter,
      yearFilter,
      search
      // question_id
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

const addQuiz = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const {
      title,
      description,
      chapter_id,
      topic_id,
      category_id,
      sub_category_id,
      thumbnail,
      duration,
      points,
      start_date,
      end_date,
      questions,
      difficulty,
      tags,
      type,
      status,
    } = req.body;
    const data = await quizService.addQuiz(
      title,
      description,
      chapter_id,
      instructor_id,
      topic_id,
      category_id,
      sub_category_id,
      thumbnail,
      duration,
      points,
      start_date,
      end_date,
      questions,
      difficulty,
      tags,
      type,
      status
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

const updateQuiz = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const {
      quiz_id,
      title,
      description,
      chapter_id,
      topic_id,
      category_id,
      sub_category_id,
      thumbnail,
      duration,
      points,
      start_date,
      end_date,
      questions,
      difficulty,
      tags,
      type,
      status,
    } = req.body;
    const data = await quizService.updateQuiz(
      quiz_id,
      title,
      description,
      chapter_id,
      instructor_id,
      topic_id,
      category_id,
      sub_category_id,
      thumbnail,
      duration,
      points,
      start_date,
      end_date,
      questions,
      difficulty,
      tags,
      type,
      status
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

const deleteQuiz = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { quiz_id } = req.query;
    const data = await quizService.deleteQuiz(instructor_id, quiz_id);
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

const addSubmission = async (req, res, next) => {
  try {
    const student_id = req.data.sub;
    const {
      quiz_id,
      status,
      started_at,
      submitted_at,
      answers,
      total_score,
      total_points,
    } = req.body;
    const data = await quizService.addSubmission(
      student_id,
      quiz_id,
      status,
      started_at,
      submitted_at,
      answers,
      total_score,
      total_points
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

const getQuizScore = async (req, res, next) => {
  try {
    // const  student_id  = req.data.sub;
    const {
      quiz_id,
      question_id,
      page,
      limit,
      monthFilter,
      yearFilter,
      search,
    } = req.query;
    const data = await quizService.getQuizScore(
      // student_id,
      quiz_id,
      question_id,
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

const getQuizAnalytics = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { quiz_id } = req.query;
    const data = await quizService.getQuizAnalytics(instructor_id, quiz_id);
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

const getQuizAnswer = async (req, res, next) => {
  try {
    const {
      quiz_id,
      question_id,
      page,
      limit,
      monthFilter,
      yearFilter,
      marked,
      search,
    } = req.query;
    const data = await quizService.getQuizAnswer(
      quiz_id,
      question_id,
      page,
      limit,
      monthFilter,
      yearFilter,
      marked,
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

const updateQuestionScore = async (req, res, next) => {
  try {
    const { quiz_id, student_id, question_id, score, is_correct, is_checked } =
      req.body;
    const data = await quizService.updateQuestionScore(
      quiz_id,
      student_id,
      question_id,
      score,
      is_correct,
      is_checked
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

const getTopStudents = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { course_id } = req.query;
    const data = await quizService.getTopStudents(instructor_id, course_id);
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
  getQuiz,
  addQuiz,
  updateQuiz,
  deleteQuiz,
  addSubmission,
  getQuizScore,
  getQuizAnswer,
  updateQuestionScore,
  getQuizAnalytics,
  getTopStudents,
};
