const { mongoManager, CONSTANT } = require("../../packages/manager");
const bcrypt = require("bcrypt");
const { randomBytes } = require("crypto");
const jwtoken = require("jsonwebtoken");
const questionModel = require("../model/question.model");
const answerModel = require("../model/answer.model");
const instructor = require("../model/instructor.model");
const course = require("../model/course.model");
const { getMonthMap } = require("../../packages/handlers");

mongoManager.connect();

const addQuestion = async (instructor_id, chapter_id, question, course_id) => {
  try {
    // const {
    //     instructor_id, chapter_id, question, course_id
    // } = payload;

    const addQuestionPayload = await questionModel.create({
      question_id: randomBytes(6).toString("hex"),
      instructor_id: instructor_id,
      chapter_id: chapter_id,
      course_id: course_id,
      question: question,
    });

    return {
      status: 201,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: addQuestionPayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const deleteQuestion = async (instructor_id, question_id) => {
  try {
    const deleteQuestionPayload = await questionModel.findOneAndDelete({
      question_id: question_id,
    });

    await answerModel.deleteMany({
      question_id: question_id,
    });

    return {
      status: 202,
      message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
      data: deleteQuestionPayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const deleteAnswer = async (instructor_id, answer_id) => {
  try {
    const deleteAnswerPayload = await answerModel.findOneAndDelete({
      answer_id: answer_id,
    });

    return {
      status: 202,
      message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
      data: deleteAnswerPayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const addAnswer = async (
  instructor_id,
  question_id,
  chapter_id,
  answer,
  course_id
) => {
  try {
    // const {
    //     question_id, instructor_id, chapter_id, answer, course_id
    // } = payload;

    const addAnswerPayload = await answerModel.create({
      answer_id: randomBytes(6).toString("hex"),
      // student_id: student_id,
      instructor_id: instructor_id,
      // chapter_id: chapter_id,
      question_id: question_id,
      course_id: course_id,
      answer: answer,
    });

    return {
      status: 201,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: addAnswerPayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const getQuestion = async (
  chapter_id,
  course_id,
  page,
  limit,
  instructor_id,
  sort_by,
  monthFilter,
  yearFilter
) => {
  try {
    const skip = (page - 1) * limit;
    let checkMatch = {};
    if (sort_by == "learner") {
      checkMatch.instructor_id = { $eq: null };
    } else if (sort_by == "instructor") {
      checkMatch.student_id = { $eq: null };
    }

    let timeCheck = {};

    if (monthFilter || yearFilter) {
      const dateConditions = [];
      monthFilter = await getMonthMap(monthFilter);
      if (monthFilter) {
        dateConditions.push({
          $eq: [{ $month: "$createdAt" }, Number(monthFilter)],
        });
      }

      if (yearFilter) {
        dateConditions.push({
          $eq: [{ $year: "$createdAt" }, Number(yearFilter)],
        });
      }

      timeCheck = {
        $expr: {
          $and: dateConditions,
        },
      };
    }

    const getQuestionPayload = await questionModel.aggregate([
      {
        $match: {
          course_id: course_id,
          ...checkMatch,
          ...timeCheck,
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student_id",
          foreignField: "student_id",
          as: "student",
        },
      },
      {
        $lookup: {
          from: "favourites",
          localField: "question_id",
          foreignField: "question_id",
          as: "favourite",
        },
      },
      {
        $lookup: {
          from: "instructors",
          localField: "instructor_id",
          foreignField: "instructor_id",
          as: "instructor",
        },
      },
      {
        $lookup: {
          from: "answers",
          let: { qid: "$question_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$question_id", "$$qid"] } } },
            {
              $lookup: {
                from: "students",
                localField: "student_id",
                foreignField: "student_id",
                as: "student",
              },
            },
            {
              $lookup: {
                from: "instructors",
                localField: "instructor_id",
                foreignField: "instructor_id",
                as: "instructor",
              },
            },
            {
              $addFields: {
                user_type: {
                  $cond: [
                    { $ifNull: ["$student_id", false] },
                    "student",
                    {
                      $cond: [
                        { $ifNull: ["$instructor_id", false] },
                        "instructor",
                        "",
                      ],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                answer_id: 1,
                answer: 1,
                chapter_id: 1,
                createdAt: 1,
                user_type: 1,
                student_id: 1,
                instructor_id: 1,
                student_first_name: {
                  $arrayElemAt: ["$student.student_first_name", 0],
                },
                student_last_name: {
                  $arrayElemAt: ["$student.student_last_name", 0],
                },
                student_avatar: {
                  $arrayElemAt: ["$student.student_avatar", 0],
                },
                instructor_first_name: {
                  $arrayElemAt: ["$instructor.instructor_first_name", 0],
                },
                instructor_last_name: {
                  $arrayElemAt: ["$instructor.instructor_last_name", 0],
                },
                instructor_avatar: {
                  $arrayElemAt: ["$instructor.instructor_avatar", 0],
                },
              },
            },
          ],
          as: "answer",
        },
      },
      {
        $addFields: {
          is_liked: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$favourite",
                    as: "f",
                    cond: {
                      $and: [
                        { $eq: ["$$f.instructor_id", instructor_id] },
                        { $eq: ["$$f.question_id", "$question_id"] },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          question_id: 1,
          student_id: 1,
          instructor_id: 1,
          student_first_name: {
            $arrayElemAt: ["$student.student_first_name", 0],
          },
          student_last_name: {
            $arrayElemAt: ["$student.student_last_name", 0],
          },
          student_avatar: { $arrayElemAt: ["$student.student_avatar", 0] },
          instructor_first_name: {
            $arrayElemAt: ["$instructor.instructor_first_name", 0],
          },
          instructor_last_name: {
            $arrayElemAt: ["$instructor.instructor_last_name", 0],
          },
          instructor_avatar: {
            $arrayElemAt: ["$instructor.instructor_avatar", 0],
          },
          question: 1,
          answer: 1,
          is_liked: 1,
          likes: { $size: ["$favourite"] },
        },
      },
    ]);

    const count = await questionModel.countDocuments({
      course_id: course_id,
      ...timeCheck,
      ...checkMatch,
    });

    return getQuestionPayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getQuestionPayload,
        }
      : {
          status: 409,
          message: CONSTANT.STATUS.NOT_FOUND,
          count: 0,
          data: [],
        };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

module.exports = {
  getQuestion,
  addQuestion,
  addAnswer,
  deleteQuestion,
  deleteAnswer,
};
