const { randomBytes } = require("crypto");
const { CONSTANT, mongoManager } = require("../../packages/manager");
const quiz = require("../model/quiz.model");
const submission = require("../model/submission.model");
const mongoose = require("mongoose");
const quizModel = require("../model/quiz.model");
const { getMonthMap } = require("../../packages/handlers");
const courseModel = require("../model/course.model");
const topicModel = require("../model/topic.model");
mongoManager.connect();

const getQuiz = async (
  page,
  limit,
  topic_id,
  quiz_id,
  instructor_id,
  sort_by,
  monthFilter,
  yearFilter,
  search
) => {
  try {
    let checkMatch = {};
    let extra = {};
    if (quiz_id) {
      checkMatch.quiz_id = quiz_id;
      extra = { questions: 1 };
    }

    if (sort_by == "published") {
      checkMatch.quiz_status = "published";
    } else if (sort_by == "draft") {
      checkMatch.quiz_status = "draft";
    } else {
    }
    const skip = (page - 1) * limit;

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
    const getQuizPayload = await quiz.aggregate([
      {
        $match: {
          instructor_id: instructor_id,
          ...(search && { quiz_title: { $regex: search, $options: "i" } }),
          ...checkMatch,
          ...timeCheck,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "category_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "sub_categories",
          localField: "sub_category_id",
          foreignField: "sub_category_id",
          as: "sub_category",
        },
      },
      {
        $lookup: {
          from: "submissions",
          localField: "quiz_id",
          foreignField: "quiz_id",
          as: "submissions",
        },
      },
      {
        $addFields: {
          // Flatten: all answers across all submissions for this quiz
          all_answers: {
            $reduce: {
              input: "$submissions",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this.answers"] },
            },
          },
        },
      },
      {
        $addFields: {
          // Group counts: [{ question_id, option_id, count }]
          option_counts: {
            $map: {
              input: "$all_answers",
              as: "answer",
              in: {
                question_id: "$$answer.question",
                // Each answer may have multiple selected_options
                selected_options: "$$answer.response.selected_options",
              },
            },
          },
        },
      },

      // ─── Merge option counts back into each question's options ─
      // {
      //   $addFields: {
      //     questions: {
      //       $map: {
      //         input: "$questions",
      //         as: "question",
      //         in: {
      //           $mergeObjects: [
      //             "$$question",
      //             // {
      //             //   options: {
      //             //     $map: {
      //             //       input: "$$question.options",
      //             //       as: "option",
      //             //       in: {
      //             //         $mergeObjects: [
      //             //           "$$option",
      //             //           {
      //             //             // Count how many answers selected this option
      //             //             selection_count: {
      //             //               $size: {
      //             //                 $filter: {
      //             //                   input: "$all_answers",
      //             //                   as: "ans",
      //             //                   cond: {
      //             //                     $and: [
      //             //                       // Answer belongs to this question
      //             //                       {
      //             //                         $eq: [
      //             //                           "$$ans.question",
      //             //                           "$$question._id",
      //             //                         ],
      //             //                       },
      //             //                       // Option was selected in this answer
      //             //                       {
      //             //                         $in: [
      //             //                           "$$option._id",
      //             //                           "$$ans.response.selected_options",
      //             //                         ],
      //             //                       },
      //             //                     ],
      //             //                   },
      //             //                 },
      //             //               },
      //             //             },
      //             //           },
      //             //         ],
      //             //       },
      //             //     },
      //             //   },
      //             // },

      //           ],
      //         },
      //       },
      //     },
      //   },
      // },
      {
        $addFields: {
          questions: {
            $map: {
              input: "$questions",
              as: "question",
              in: {
                $mergeObjects: [
                  "$$question",
                  {
                    options: {
                      $map: {
                        input: "$$question.options",
                        as: "option",
                        in: {
                          $mergeObjects: [
                            "$$option",
                            {
                              selection_count: {
                                $size: {
                                  $filter: {
                                    input: "$all_answers",
                                    as: "ans",
                                    cond: {
                                      $and: [
                                        {
                                          $eq: [
                                            "$$ans.question",
                                            "$$question._id",
                                          ],
                                        },
                                        {
                                          $in: [
                                            "$$option._id",
                                            "$$ans.response.selected_options",
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                            },
                          ],
                        },
                      },
                    },

                    // ✅ FIXED is_pending (no nested $addFields)
                    is_pending: {
                      $not: {
                        $allElementsTrue: {
                          $map: {
                            input: {
                              $filter: {
                                input: "$all_answers",
                                as: "ans",
                                cond: {
                                  $eq: ["$$ans.question", "$$question._id"],
                                },
                              },
                            },
                            as: "filteredAns",
                            in: "$$filteredAns.is_checked",
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },

      {
        $addFields: {
          questions_count: { $size: "$questions" },
          quiz_submission: { $size: "$submissions" },
          quiz_thumbnail: {
            $ifNull: ["$quiz_thumbnail", null],
          },
          submission_obtained_points: { $sum: "$submissions.total_score" },

          submission_max_points: {
            $multiply: [{ $size: "$submissions" }, "$total_points"],
          },
          accuracy: {
            $cond: {
              if: {
                $gt: [
                  { $multiply: [{ $size: "$submissions" }, "$total_points"] },
                  0,
                ],
              },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $sum: "$submissions.total_score" },
                      {
                        $multiply: [{ $size: "$submissions" }, "$total_points"],
                      },
                    ],
                  },
                  100,
                ],
              },
              else: 0,
            },
          },
        },
      },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          quiz_id: 1,
          quiz_title: 1,
          quiz_thumbnail: 1,
          course_id: 1,
          quiz_description: 1,
          chapter_id: 1,
          topic_id: 1,
          quiz_duration: 1,
          total_points: 1,
          quiz_title: 1,
          quiz_difficulty: 1,
          quiz_tags: 1,
          createdAt: 1,
          quiz_status: 1,
          start_date: 1,
          end_date: 1,
          category_id: 1,
          sub_category_id: 1,
          quiz_type: 1,
          category_name: { $arrayElemAt: ["$category.category_title", 0] },
          sub_category_name: {
            $arrayElemAt: ["$sub_category.sub_category_title", 0],
          },
          questions_count: 1,
          quiz_submission: 1,
          accuracy: 1,
          ...extra,
        },
      },
    ]);
    const count = await quiz.countDocuments({
      instructor_id: instructor_id,
      ...(search && { quiz_title: { $regex: search, $options: "i" } }),
      ...checkMatch,
      ...timeCheck,
    });
    const response = getQuizPayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getQuizPayload,
        }
      : {
          status: 409,
          message: CONSTANT.STATUS.NOT_FOUND,
          data: [],
        };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const addQuiz = async (
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
) => {
  try {
    const addQuizPayload = await quiz.create({
      quiz_id: randomBytes(6).toString("hex"),
      quiz_title: title,
      quiz_description: description,
      chapter_id: chapter_id,
      instructor_id: instructor_id,
      quiz_title: title,
      topic_id: topic_id,
      quiz_type: type,
      quiz_duration: duration,
      total_points: points,
      quiz_tags: tags,
      quiz_difficulty: difficulty,
      start_date: start_date,
      end_date: end_date,
      questions: questions,
      category_id: category_id,
      sub_category_id: sub_category_id,
      quiz_thumbnail: thumbnail,
      quiz_status: status,
    });

    const response =
      addQuizPayload !== null
        ? {
            status: 201,
            message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
            data: addQuizPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const updateQuiz = async (
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
) => {
  try {
    const addQuizPayload = await quiz.findOneAndUpdate(
      { quiz_id: quiz_id, instructor_id: instructor_id, quiz_type: type },
      {
        quiz_title: title,
        quiz_description: description,
        chapter_id: chapter_id,
        quiz_title: title,
        topic_id: topic_id,
        quiz_duration: duration,
        total_points: points,
        quiz_tags: tags,
        quiz_difficulty: difficulty,
        start_date: start_date,
        end_date: end_date,
        questions: questions,
        category_id: category_id,
        sub_category_id: sub_category_id,
        quiz_thumbnail: thumbnail,
        quiz_status: status,
      }
    );

    const response =
      addQuizPayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
            data: addQuizPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const deleteQuiz = async (instructor_id, quiz_id) => {
  try {
    const deleteQuizPayload = await quiz.findOneAndDelete({
      quiz_id: quiz_id,
      instructor_id: instructor_id,
    });
    await topicModel.updateMany(
      { quiz_id: quiz_id },
      { $set: { quiz_id: null } }
    );
    const response =
      deleteQuizPayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
            data: deleteQuizPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.NOT_FOUND,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const addSubmission = async (
  student_id,
  quiz_id,
  status,
  started_at,
  submitted_at,
  answers,
  total_score,
  total_points
) => {
  try {
    let quiz_attempt = 1;
    const existingSubmission = await submission.find({
      student_id: student_id,
      quiz_id: quiz_id,
    });
    if (existingSubmission) {
      quiz_attempt = existingSubmission.length + 1;
    }

    // const {
    //     quiz_id,
    //     status,
    //     started_at,
    //     submitted_at,
    //     answers,
    //     total_score,
    //     total_points,
    // } = payload
    const addQuizPayload = await submission.create({
      submission_id: randomBytes(6).toString("hex"),
      quiz_id: quiz_id,
      student_id: student_id,
      status: status,
      started_at: started_at,
      submitted_at: submitted_at,
      answers: answers,
      total_score: total_score,
      quiz_total_points: total_points,
      quiz_attempt: quiz_attempt,
    });

    const response =
      addQuizPayload !== null
        ? {
            status: 201,
            message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
            data: addQuizPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const getQuizScore = async (
  quiz_id,
  question_id,
  page,
  limit,
  monthFilter,
  yearFilter,
  search
) => {
  try {
    skip = (page - 1) * limit;

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

    const getQuizScorePayload = await submission.aggregate([
      { $match: { quiz_id: quiz_id, ...timeCheck } },
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz_id",
          foreignField: "quiz_id",
          as: "quizzes",
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student_id",
          foreignField: "student_id",
          as: "students",
        },
      },
      {
        $match: {
          $or: [
            { "students.student_first_name": new RegExp(search, "i") },
            { "students.student_last_name": new RegExp(search, "i") },
          ],
        },
      },
      {
        $lookup: {
          from: "categories",
          let: { categoryId: "$quizzes.category_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$category_id", "$$categoryId"],
                },
              },
            },
          ],
          as: "category",
        },
      },
      {
        $lookup: {
          from: "sub_categories",
          let: { subCategoryId: "$quizzes.sub_category_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$sub_category_id", "$$subCategoryId"],
                },
              },
            },
          ],
          as: "sub_category",
        },
      },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          quiz_id: 1,
          submission_id: 1,
          student_id: 1,
          student_avatar: { $arrayElemAt: ["$students.student_avatar", 0] },
          student_first_name: {
            $arrayElemAt: ["$students.student_first_name", 0],
          },
          student_last_name: {
            $arrayElemAt: ["$students.student_last_name", 0],
          },
          started_at: 1,
          submitted_at: 1,
          total_score: 1,
          quiz_attempt: 1,
          quiz_total_points: 1,
          category_id: 1,
          sub_category_id: 1,
          quiz_title: { $arrayElemAt: ["$quizzes.quiz_title", 0] },
          course_id: { $arrayElemAt: ["$quizzes.course_id", 0] },
          total_question: {
            $size: {
              $ifNull: [{ $arrayElemAt: ["$quizzes.questions", 0] }, []],
            },
          },
          quiz_type: { $arrayElemAt: ["$quizzes.quiz_type", 0] },
          quiz_thumbnail: { $arrayElemAt: ["$quizzes.quiz_thumbnail", 0] },
          quiz_duration: { $arrayElemAt: ["$quizzes.quiz_duration", 0] },
          category_name: { $arrayElemAt: ["$category.category_title", 0] },
          sub_category_name: {
            $arrayElemAt: ["$sub_category.sub_category_title", 0],
          },
          answers: 1,
        },
      },
    ]);

    const result = await submission.aggregate([
      {
        $match: {
          quiz_id: quiz_id,
          ...timeCheck,
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student_id",
          foreignField: "student_id",
          as: "students",
        },
      },
      {
        $unwind: "$students", // important for proper filtering
      },
      {
        $match: {
          $or: [
            { "students.student_first_name": new RegExp(search, "i") },
            { "students.student_last_name": new RegExp(search, "i") },
          ],
        },
      },
      {
        $count: "total",
      },
    ]);

    const count = result[0]?.total || 0;
    const response = getQuizScorePayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getQuizScorePayload,
        }
      : {
          status: 409,
          message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
          data: [],
        };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};
const getQuizAnswer = async (
  quiz_id,
  question_id,
  page,
  limit,
  monthFilter,
  yearFilter,
  marked,
  search
) => {
  try {
    skip = (page - 1) * limit;
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

    if (marked != undefined && (marked === "true" || marked === "false")) {
      checkmatch = {
        "answers.is_checked": marked === "true" ? true : false,
      };
    } else {
      checkmatch = {};
    }
    const result = await submission.aggregate([
      { $match: { quiz_id: quiz_id, ...timeCheck } },
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz_id",
          foreignField: "quiz_id",
          as: "quizzes",
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student_id",
          foreignField: "student_id",
          as: "students",
        },
      },
      {
        $match: {
          $or: [
            { "students.student_first_name": new RegExp(search, "i") },
            { "students.student_last_name": new RegExp(search, "i") },
          ],
        },
      },
      {
        $addFields: {
          answers: {
            $filter: {
              input: "$answers",
              as: "answer",
              cond: {
                $eq: [
                  "$$answer.question",
                  new mongoose.Types.ObjectId(question_id),
                ],
              },
            },
          },
        },
      },
      {
        $match: {
          "answers.0": { $exists: true },
          ...checkmatch,
        },
      },
      {
        $facet: {
          data: [
            { $skip: Number(skip) },
            { $limit: Number(limit) },
            {
              $project: {
                quiz_id: 1,
                point: "6", //"$quizzes.question.points",
                submission_id: 1,
                student_id: 1,
                student_avatar: {
                  $ifNull: [
                    {
                      $arrayElemAt: ["$students.student_avatar", 0],
                    },
                    null,
                  ],
                },
                student_first_name: {
                  $arrayElemAt: ["$students.student_first_name", 0],
                },
                student_last_name: {
                  $arrayElemAt: ["$students.student_last_name", 0],
                },
                answer: { $arrayElemAt: ["$answers", 0] },
                is_pending: {
                  //if answer given for this question is checked then ispending false else true
                  $not: {
                    $allElementsTrue: {
                      $map: {
                        input: "$answers",
                        as: "ans",
                        in: "$$ans.is_checked",
                      },
                    },
                  },
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const getQuizAnswerPayload = result[0]?.data || [];
    const count = result[0]?.totalCount[0]?.count || 0;

    // const count = await quiz.countDocuments({ quiz_id: quiz_id });
    const response = getQuizAnswerPayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getQuizAnswerPayload,
        }
      : {
          status: 409,
          message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
          data: [],
        };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const updateQuestionScore = async (
  quiz_id,
  student_id,
  question_id,
  score,
  is_correct,
  is_checked
) => {
  try {
    const questionScorePayload = await submission.findOneAndUpdate(
      {
        quiz_id: quiz_id,
        student_id: student_id,
        "answers.question": new mongoose.Types.ObjectId(question_id),
      },
      {
        $set: {
          "answers.$.score": score,
          "answers.$.is_correct": is_correct,
          "answers.$.is_checked": is_checked,
        },
      }
    );
    const response =
      questionScorePayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
            data: questionScorePayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.NOT_FOUND,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const getQuizAnalytics = async (instructor_id, quiz_id) => {
  try {
    let getQuizAnalyticsPayload;
    if (quiz_id) {
      getQuizAnalyticsPayload = await quiz.aggregate([
        {
          $match: {
            quiz_id: quiz_id,
          },
        },
        {
          $lookup: {
            from: "topics",
            pipeline: [
              {
                $match: {
                  quiz_id: quiz_id,
                },
              },
            ],
            as: "topics",
          },
        },
        {
          $lookup: {
            from: "courses",
            let: { courseId: { $arrayElemAt: ["$topics.course_id", 0] } },
            pipeline: [
              { $match: { $expr: { $eq: ["$course_id", "$$courseId"] } } },
            ],
            as: "courses",
          },
        },
        {
          $lookup: {
            from: "submissions",
            pipeline: [
              {
                $match: {
                  quiz_id: quiz_id,
                },
              },
            ],
            as: "submissions",
          },
        },
        {
          $lookup: {
            from: "students",
            let: {
              studentIds: "$submissions.student_id",
              submissionsList: "$submissions",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$student_id", "$$studentIds"],
                  },
                },
              },
              {
                $lookup: {
                  from: "submissions",
                  let: { sid: "$student_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$student_id", "$$sid"] },
                            { $eq: ["$quiz_id", quiz_id] },
                          ],
                        },
                      },
                    },
                  ],
                  as: "student_submission",
                },
              },
              {
                $project: {
                  _id: 0,
                  student_id: 1,
                  student_first_name: 1,
                  student_last_name: 1,
                  student_avatar: 1,
                  student_state: 1,
                  student_country: 1,
                  createdAt: 1,
                  student_total_score: {
                    $arrayElemAt: ["$student_submission.total_score", 0],
                  },
                  student_total_points: {
                    $arrayElemAt: ["$student_submission.quiz_total_points", 0],
                  },
                },
              },

              { $sort: { student_total_score: -1 } },
              {
                $setWindowFields: {
                  sortBy: { student_total_score: -1 },
                  output: {
                    rank: { $rank: {} },
                  },
                },
              },
              {
                $match: { rank: { $lte: 10 } },
              },
            ],
            as: "top_students",
          },
        },
        {
          $addFields: {
            total_enrolled: { $arrayElemAt: ["$courses.student_enrolled", 0] },
            total_submission: { $size: "$submissions" },
            obtained_score: {
              $sum: "$submissions.total_score",
            },

            total_points: {
              $sum: "$submissions.quiz_total_points",
            },
          },
        },
        {
          $addFields: {
            total_avg_points: {
              $cond: {
                if: { $gt: ["$total_submission", 0] },
                then: {
                  $round: [
                    { $divide: ["$total_points", "$total_submission"] },
                    1,
                  ],
                },
                else: 0,
              },
            },
            obtained_avg_score: {
              $cond: {
                if: { $gt: ["$total_submission", 0] },
                then: {
                  $round: [
                    { $divide: ["$obtained_score", "$total_submission"] },
                    1,
                  ],
                },
                else: 0,
              },
            },
          },
        },
        {
          $project: {
            total_submission: 1,
            total_enrolled: {
              $ifNull: [{ $arrayElemAt: ["$courses.student_enrolled", 0] }, 0],
            },
            top_students: 1,
            total_points: 1,
            obtained_score: 1,
            obtained_avg_score: 1,
            total_avg_points: 1,
            completion_rate: {
              $round: [
                {
                  $multiply: [
                    {
                      $cond: {
                        if: { $gt: ["$total_enrolled", 0] },
                        then: {
                          $divide: ["$total_submission", "$total_enrolled"],
                        },
                        else: 0,
                      },
                    },
                    100,
                  ],
                },
                1,
              ],
            },
            accuracy_rate: {
              $round: [
                {
                  $multiply: [
                    {
                      $cond: {
                        if: { $gt: ["$total_points", 0] },
                        then: {
                          $divide: ["$obtained_score", "$total_points"],
                        },
                        else: 0,
                      },
                    },
                    100,
                  ],
                },
                1,
              ],
            },
            // completion_rate: {
            //   $round: [
            //     {
            //       $multiply: [
            //         {
            //           $divide: ["$total_submission", "$total_enrolled"],
            //         },
            //         100,
            //       ],
            //     },
            //     1,
            //   ],
            // },
            // accuracy_rate: {
            //   $round: [
            //     {
            //       $multiply: [
            //         {
            //           $divide: ["$obtained_score", "$total_points"],
            //         },
            //         100,
            //       ],
            //     },
            //     1,
            //   ],
            // },
          },
        },
      ]);
    } else {
      getQuizAnalyticsPayload = await quiz.aggregate([
        {
          $match: {
            instructor_id: instructor_id,
          },
        },
        {
          $lookup: {
            from: "submissions",
            localField: "quiz_id",
            foreignField: "quiz_id",
            as: "submissions",
          },
        },
        {
          $addFields: {
            total_submission: { $size: "$submissions" },
            total_points: {
              $ifNull: [{ $sum: "$submissions.quiz_total_points" }, 0],
            },
            obtained_score: {
              $ifNull: [{ $sum: "$submissions.total_score" }, 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            total_quizs: { $sum: 1 },
            total_submission: { $sum: "$total_submission" },
            total_points: {
              $sum: { $ifNull: ["$total_points", 0] },
            },
            obtained_score: {
              $sum: { $ifNull: ["$obtained_score", 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            total_quizs: 1,
            total_submission: 1,
            total_points: 1,
            obtained_score: 1,
            completion_rate: {
              $round: [
                {
                  $multiply: [
                    {
                      $cond: {
                        if: { $gt: ["$total_quizs", 0] },
                        then: {
                          $divide: ["$total_submission", "$total_quizs"],
                        },
                        else: 0,
                      },
                    },
                    100,
                  ],
                },
                1,
              ],
            },
            accuracy_rate: {
              $round: [
                {
                  $multiply: [
                    {
                      $cond: {
                        if: { $gt: ["$total_points", 0] },
                        then: {
                          $divide: ["$obtained_score", "$total_points"],
                        },
                        else: 0,
                      },
                    },
                    100,
                  ],
                },
                1,
              ],
            },
            // completion_rate: {
            //   $round: [
            //     {
            //       $multiply: [
            //         {
            //           $cond: {
            //             if: { $gt: ["$total_quizs", 0] },
            //             then: {
            //               $divide: ["$total_submission", "$total_quizs"],
            //             },
            //             else: 0,
            //           },
            //         },
            //         100,
            //       ],
            //     },
            //     1,
            //   ],
            // },
            // accuracy_rate: {
            //   $round: [
            //     {
            //       $multiply: [
            //         {
            //           $cond: {
            //             if: { $gt: ["$total_points", 0] },
            //             then: {
            //               $divide: ["$obtained_score", "$total_points"],
            //             },
            //             else: 0,
            //           },
            //         },
            //         100,
            //       ],
            //     },
            //     1,
            //   ],
            // },
          },
        },
      ]);
    }
    let response =
      getQuizAnalyticsPayload !== null
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
            data: getQuizAnalyticsPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.NOT_FOUND,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const getTopStudents = async (instructor_id, course_id) => {
  try {
    // const getTopStudents = await courseModel.aggregate([
    //   {
    //     $match: {
    //       instructor_id: instructor_id,
    //       // course_id: course_id,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "topics",
    //       pipeline: [{ $match: { course_id: course_id } }],
    //       as: "topics",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "submissions",
    //       let: { quizIds: "$topics.quiz_id" },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: { $in: ["$quiz_id", "$$quizIds"] },
    //           },
    //         },
    //       ],
    //       as: "submissions",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "students",
    //       let: {
    //         studentIds: "$submissions.student_id",
    //         quizIds: "$topics.quiz_id",
    //       },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: { $in: ["$student_id", "$$studentIds"] },
    //           },
    //         },
    //         {
    //           $lookup: {
    //             from: "submissions",
    //             let: {
    //               sid: "$student_id",
    //               qids: "$$quizIds",
    //             },
    //             pipeline: [
    //               {
    //                 $match: {
    //                   $expr: {
    //                     $and: [
    //                       { $eq: ["$student_id", "$$sid"] },
    //                       { $in: ["$quiz_id", "$$qids"] },
    //                     ],
    //                   },
    //                 },
    //               },
    //             ],
    //             as: "student_submission",
    //           },
    //         },
    //         {
    //           $project: {
    //             _id: 0,
    //             student_id: 1,
    //             student_first_name: 1,
    //             student_last_name: 1,
    //             student_avatar: 1,
    //             student_total_score: {
    //               $sum: "$student_submission.total_score",
    //             },
    //             student_total_points: {
    //               $sum: "$student_submission.quiz_total_points",
    //             },
    //           },
    //         },
    //         { $sort: { student_total_score: -1 } },
    //         {
    //           $setWindowFields: {
    //             sortBy: { student_total_score: -1 },
    //             output: { rank: { $rank: {} } },
    //           },
    //         },
    //         { $limit: 10 },
    //         { $match: { rank: { $lte: 3 } } },
    //       ],
    //       as: "top_students",
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       top_students: 1,
    //     },
    //   },
    // ]);

    const getTopStudents = await courseModel.aggregate([
      {
        $match: {
          instructor_id: instructor_id,
          ...(course_id ? { course_id: course_id } : {}),
        },
      },
      {
        $lookup: {
          from: "topics",
          pipeline: [
            {
              $match: {
                ...(course_id ? { course_id: course_id } : {}),
              },
            },
          ],
          as: "topics",
        },
      },
      {
        $lookup: {
          from: "submissions",
          let: { quizIds: "$topics.quiz_id" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$quiz_id", "$$quizIds"] },
              },
            },
          ],
          as: "submissions",
        },
      },
      {
        $lookup: {
          from: "students",
          let: {
            studentIds: "$submissions.student_id",
            quizIds: "$topics.quiz_id",
          },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$student_id", "$$studentIds"] },
              },
            },
            {
              $lookup: {
                from: "submissions",
                let: {
                  sid: "$student_id",
                  qids: "$$quizIds",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$student_id", "$$sid"] },
                          { $in: ["$quiz_id", "$$qids"] },
                        ],
                      },
                    },
                  },
                ],
                as: "student_submission",
              },
            },
            {
              $project: {
                _id: 0,
                student_id: 1,
                student_first_name: 1,
                student_last_name: 1,
                student_avatar: 1,
                student_total_score: {
                  $sum: "$student_submission.total_score",
                },
                student_total_points: {
                  $sum: "$student_submission.quiz_total_points",
                },
              },
            },
            { $sort: { student_total_score: -1 } },

            // ✅ keep rank (if needed)
            {
              $setWindowFields: {
                sortBy: { student_total_score: -1 },
                output: { rank: { $rank: {} } },
              },
            },

            // ✅ top 10 only
            { $match: { rank: { $lte: 10 } } },
          ],
          as: "top_students",
        },
      },
      {
        $project: {
          _id: 0,
          top_students: 1,
        },
      },
    ]);
    const response =
      getTopStudents !== null
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
            data: getTopStudents.length ? getTopStudents[0].top_students : [],
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.NOT_FOUND,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

module.exports = {
  addQuiz,
  updateQuiz,
  deleteQuiz,
  getQuiz,
  addSubmission,
  getQuizScore,
  getQuizAnswer,
  updateQuestionScore,
  getQuizAnalytics,
  getTopStudents,
};
