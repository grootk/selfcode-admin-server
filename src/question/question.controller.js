const questionService = require("./question.services");
const { successHandler, errorHandler } = require("../../packages/handlers");

const getQuestion = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const {
      chapter_id,
      course_id,
      page,
      limit,
      sort_by,
      monthFilter,
      yearFilter,
    } = req.query;
    const data = await questionService.getQuestion(
      chapter_id,
      course_id,
      page,
      limit,
      instructor_id,
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

const addQuestion = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { chapter_id, question, course_id } = req.body;
    const data = await questionService.addQuestion(
      instructor_id,
      chapter_id,
      question,
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

const deleteQuestion = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { question_id } = req.query;
    const data = await questionService.deleteQuestion(
      instructor_id,
      question_id
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

const addAnswer = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { question_id, chapter_id, answer, course_id } = req.body;
    const data = await questionService.addAnswer(
      instructor_id,
      question_id,
      chapter_id,
      answer,
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
const deleteAnswer = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { answer_id } = req.query;
    const data = await questionService.deleteAnswer(instructor_id, answer_id);
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
  getQuestion,
  addQuestion,
  addAnswer,
  deleteQuestion,
  deleteAnswer,
};
