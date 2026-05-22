const { randomBytes } = require("crypto");
const { CONSTANT, mongoManager } = require("../../packages/manager");
const course = require("../model/course.model");
const chapter = require("../model/chapter.model");
const instructor = require("../model/instructor.model");
const topic = require("../model/topic.model");
const favouriteModel = require("../model/favourite.model");
const topicModel = require("../model/topic.model");
const student = require("../model/student.model");
const chapterModel = require("../model/chapter.model");
const courseModel = require("../model/course.model");
const activity = require("../model/activity.model");
const { getMonthMap } = require("../../packages/handlers");

mongoManager.connect();

const getAllCourses = async (instructor_id, page, limit, search) => {
  try {
    const skip = (page - 1) * limit;
    let checkMatch = {};

    if (search) {
      checkMatch.course_title = new RegExp(`^${search}`, "i");
    }

    const getAllCoursePayload = await course.aggregate([
      {
        $match: { instructor_id: instructor_id, ...checkMatch },
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
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          course_id: 1,
          course_title: 1,
          course_thumbnail: 1,
          category_name: { $arrayElemAt: ["$category.category_title", 0] },
          sub_category_name: {
            $arrayElemAt: ["$sub_category.sub_category_title", 0],
          },
          course_total_rating: { $ifNull: ["$course_total_rating", 0] },
          reviewed_by: { $ifNull: ["$reviewed_by", 0] },
        },
      },
    ]);
    const count = await course.countDocuments({
      instructor_id: instructor_id,
      ...checkMatch,
    });
    const response = getAllCoursePayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getAllCoursePayload,
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

const getCourse = async (
  instructor_id,
  page,
  limit,
  search,
  status,
  sort_by,
  monthFilter,
  yearFilter,
  student_id
) => {
  try {
    const skip = (page - 1) * limit;
    let checkMatch = {},
      statusMatch = {};

    if (search) {
      checkMatch.course_title = new RegExp(`^${search}`, "i");
    }

    if (instructor_id) {
      checkMatch.instructor_id = instructor_id;
    }

    if (status === "published") {
      statusMatch.course_status = "published";
    } else if (status === "inreview") {
      statusMatch.course_status = "inreview";
    } else if (status === "rejected") {
      statusMatch.course_status = "rejected";
    }

    // let sortStage = {};
    // if (sort_by === "top") {
    //   sortStage = { $sort: { total_enrolled: -1 } };
    // } else if (sort_by === "recent") {
    //   sortStage = { $sort: { createdAt: -1 } };
    // } else if (sort_by === "oldest") {
    //   sortStage = { $sort: { createdAt: 1 } };
    // } else {
    //   sortStage = { $sort: { createdAt: -1 } };
    // }

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

    const getCoursePayload = await course.aggregate([
      {
        $match: {
          course_status: { $ne: "draft" },
          ...checkMatch,
          ...timeCheck,
          ...statusMatch,
        },
      },
      {
        $lookup: {
          from: "chapters",
          localField: "course_id",
          foreignField: "course_id",
          as: "chapters",
        },
      },
      {
        $lookup: {
          from: "topics",
          localField: "course_id",
          foreignField: "course_id",
          as: "topic",
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
          from: "course_completions",
          localField: "course_id",
          foreignField: "course_id",
          as: "completions",
        },
      },
      {
        $lookup: {
          from: "purchases",
          localField: "course_id",
          foreignField: "course_id",
          as: "purchases",
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
          category_name: { $arrayElemAt: ["$category.category_title", 0] },
          sub_category_name: {
            $arrayElemAt: ["$sub_category.sub_category_title", 0],
          },
          instructor_first_name: {
            $arrayElemAt: ["$instructor.instructor_first_name", 0],
          },
          instructor_last_name: {
            $arrayElemAt: ["$instructor.instructor_last_name", 0],
          },
          total_enrolled: { $size: "$completions" },
          chapter_count: { $size: "$chapters" },
          course_duration: { $sum: "$chapters.chapter_duration" },
          total_revenue: { $sum: "$purchases.course_amount" },
          quiz_count: {
            $size: {
              $filter: {
                input: "$topic",
                as: "c",
                cond: { $eq: ["$$c.topic_type", "quiz"] },
              },
            },
          },
          // completed_count: {
          //   $size: {
          //     $filter: {
          //       input: "$completions",
          //       as: "c",
          //       cond: { $eq: ["$$c.course_status", "complete"] },
          //     },
          //   },
          // },
          // completion_rate: {
          //   $cond: {
          //     if: { $gt: [{ $size: "$completions" }, 0] },
          //     then: {
          //       $multiply: [
          //         {
          //           $divide: [
          //             {
          //               $size: {
          //                 $filter: {
          //                   input: "$completions",
          //                   as: "c",
          //                   cond: { $eq: ["$$c.course_status", "complete"] },
          //                 },
          //               },
          //             },
          //             { $size: "$completions" },
          //           ],
          //         },
          //         100,
          //       ],
          //     },
          //     else: 0,
          //   },
          // },
        },
      },
      // {
      //   $setWindowFields: {
      //     sortBy: { total_enrolled: -1 },
      //     output: {
      //       enrollment_rank: { $rank: {} },
      //     },
      //   },
      // },
      // {
      //   $addFields: {
      //     top_seller: {
      //       $and: [
      //         { $lte: ["$enrollment_rank", 3] },
      //         { $gt: ["$total_enrolled", 0] },
      //       ],
      //     },
      //   },
      // },
      // {
      //   $addFields: {
      //     // sort chapters by rank first
      //     sorted_chapters: {
      //       $sortArray: {
      //         input: "$chapters",
      //         sortBy: { chapter_rank: 1 },
      //       },
      //     },

      //     // sort topics (important!)
      //     sorted_topics: {
      //       $sortArray: {
      //         input: "$topic",
      //         sortBy: { topic_rank: 1 },
      //       },
      //     },
      //   },
      // },
      // {
      //   $addFields: {
      //     current_chapter: {
      //       $arrayElemAt: ["$sorted_chapters", 0],
      //     },
      //     next_chapter: {
      //       $arrayElemAt: ["$sorted_chapters", 1],
      //     },
      //   },
      // },
      // {
      //   $addFields: {
      //     current_chapter: {
      //       chapter_id: "$current_chapter.chapter_id",
      //       chapter_rank: "$current_chapter.chapter_rank",
      //       chapter_title: "$current_chapter.chapter_title",
      //       chapter_duration: "$current_chapter.chapter_duration",

      //       current_topic_id: {
      //         $ifNull: [{ $arrayElemAt: ["$sorted_topics.topic_id", 0] }, null],
      //       },
      //       next_topic_id: {
      //         $ifNull: [{ $arrayElemAt: ["$sorted_topics.topic_id", 1] }, null],
      //       },
      //     },
      //     next_chapter: {
      //       chapter_id: "$next_chapter.chapter_id",
      //       chapter_rank: "$next_chapter.chapter_rank",
      //       chapter_title: "$next_chapter.chapter_title",
      //       chapter_duration: "$next_chapter.chapter_duration",
      //     },
      //   },
      // },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          instructor_id: { $ifNull: ["$instructor_id", ""] },
          instructor_first_name: 1,
          instructor_last_name: 1,
          course_id: { $ifNull: ["$course_id", ""] },
          course_title: { $ifNull: ["$course_title", ""] },
          course_description: { $ifNull: ["$course_description", ""] },
          course_thumbnail: { $ifNull: ["$course_thumbnail", ""] },
          course_price: { $ifNull: ["$course_price", 0] },
          category_name: { $ifNull: ["$category_name", ""] },
          course_status: { $ifNull: ["$course_status", ""] },
          course_review_date: { $ifNull: ["$course_review_date", null] },
          course_published_date: { $ifNull: ["$course_published_date", null] },
          sub_category_name: { $ifNull: ["$sub_category_name", ""] },
          reviewed_by: { $ifNull: ["$reviewed_by", null] },
          createdAt: { $ifNull: ["$createdAt", null] },
          chapter_count: { $ifNull: ["$chapter_count", 0] },
          quiz_count: { $ifNull: ["$quiz_count", 0] },
          course_duration: { $ifNull: ["$course_duration", 0] },
          total_enrolled: { $ifNull: ["$total_enrolled", 0] },
          // course_price_type: { $ifNull: ["$course_price_type", ""] },
          // course_status: { $ifNull: ["$course_status", ""] },

          // completed_count: { $ifNull: ["$completed_count", 0] },
          // completion_rate: {
          //   $round: [{ $ifNull: ["$completion_rate", 0] }, 0],
          // },
          // course_total_rating: { $ifNull: ["$course_total_rating", 0] },

          // total_lessons: { $ifNull: ["$total_lessons", 0] },
          // total_quizzes: { $ifNull: ["$total_quizzes", 0] },
          // top_seller: { $ifNull: ["$top_seller", false] },
          // total_revenue: { $ifNull: ["$total_revenue", 0] },
          // next_chapter: {
          //   chapter_id: { $ifNull: ["$next_chapter.chapter_id", null] },
          //   chapter_rank: { $ifNull: ["$next_chapter.chapter_rank", null] },
          //   chapter_title: { $ifNull: ["$next_chapter.chapter_title", null] },
          //   chapter_duration: {
          //     $ifNull: ["$next_chapter.chapter_duration", null],
          //   },
          // },
          // current_chapter: {
          //   chapter_id: { $ifNull: ["$current_chapter.chapter_id", null] },
          //   chapter_rank: { $ifNull: ["$current_chapter.chapter_rank", null] },
          //   chapter_title: {
          //     $ifNull: ["$current_chapter.chapter_title", null],
          //   },
          //   chapter_duration: {
          //     $ifNull: ["$current_chapter.chapter_duration", null],
          //   },
          //   current_topic_id: {
          //     $ifNull: ["$current_chapter.current_topic_id", null],
          //   },
          //   next_topic_id: {
          //     $ifNull: ["$current_chapter.next_topic_id", null],
          //   },
          // },
        },
      },
    ]);

    const count = await course.countDocuments({
      course_status: { $ne: "draft" },
      ...checkMatch,
      ...timeCheck,
    });

    const publishedCount = await course.countDocuments({
      course_status: "published",
      ...timeCheck,
      ...checkMatch,
    });
    const reviewCount = await course.countDocuments({
      course_status: "inreview",
      ...timeCheck,
      ...checkMatch,
    });
    const rejectedCount = await course.countDocuments({
      course_status: "rejected",
      ...timeCheck,
      ...checkMatch,
    });

    const response = getCoursePayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          publishedCount: publishedCount,
          reviewCount: reviewCount,
          rejectedCount: rejectedCount,
          data: getCoursePayload,
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

const addCourse = async (
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
) => {
  try {
    let course_id = randomBytes(6).toString("hex");
    const addCoursePayload = await course.create({
      course_id: course_id,
      category_id: category_id,
      sub_category_id: sub_category_id,
      instructor_id: instructor_id,
      course_title: title,
      course_description: description,
      course_overview: overview,
      course_price: price,
      course_discount: discount,
      course_thumbnail: thumbnail,
      course_status: status,
      course_promovideo: promovideo,
      skill_gained: skill,
      is_promotional: promotinal,
      promotional_coupons: promotinal_coupons,
      course_coupons: coupons,
      course_price_type: price_type,
    });
    await instructor.findOneAndUpdate(
      { instructor_id: instructor_id },
      { $inc: { course_count: 1 } }
    );
    await activity.create({
      activity_id: randomBytes(6).toString("hex"),
      instructor_id: instructor_id,
      activity_type: "course_created",
      course_id: course_id,
    });
    const response =
      addCoursePayload !== null
        ? {
            status: 201,
            message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
            data: addCoursePayload,
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

const updateCourse = async (
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
) => {
  try {
    let review_date;
    if (status === "inreview") {
      review_date = new Date();
    }
    const updateCoursePayload = await course.findOneAndUpdate(
      { course_id: course_id },
      {
        category_id: category_id,
        subcategory_id: subcategory_id,
        instructor_id: instructor_id,
        course_title: title,
        course_description: description,
        course_overview: overview,
        course_price: price,
        course_discount: discount,
        course_tags: tags,
        course_level: level,
        course_language: language,
        course_thumbnail: thumbnail,
        course_status: status,
        course_review_date: review_date,
        course_promovideo: promovideo,
        skill_gained: skill,
        is_promotional: promotinal,
        promotional_coupons: promotinal_coupons,
        course_coupons: coupons,
        course_price_type: price_type,
      }
    );
    await activity.create({
      activity_id: randomBytes(6).toString("hex"),
      activity_type: "course_edit",
      instructor_id: instructor_id,
      course_id: course_id,
    });
    const response =
      updateCoursePayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
            data: updateCoursePayload,
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

const deleteCourse = async (course_id, instructor_id) => {
  try {
    const deleteCoursePayload = await course.findOneAndDelete({
      course_id: course_id,
    });

    await instructor.findOneAndUpdate(
      { instructor_id: instructor_id },
      { $inc: { course_count: -1 } }
    );

    await chapter.deleteMany({ course_id: course_id });

    await topic.deleteMany({ course_id: course_id });

    const response =
      deleteCoursePayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
            data: deleteCoursePayload,
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

const getCourseDetail = async (course_id, instructor_id) => {
  try {
    const getCourseDetailPayload = await course.aggregate([
      { $match: { course_id: course_id } },
      {
        $lookup: {
          from: "course_completions",
          let: { cid: "$course_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course_id", "$$cid"] },
                    { $eq: ["$course_status", "completed"] },
                  ],
                },
              },
            },
          ],
          as: "course_complete",
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
          as: "subCategory",
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
          from: "chapters",
          localField: "course_id",
          foreignField: "course_id",
          as: "chapters",
        },
      },
      {
        $lookup: {
          from: "topics",
          localField: "course_id",
          foreignField: "course_id",
          as: "topic",
          pipeline: [
            {
              $match: {
                topic_type: "quiz",
              },
            },
          ],
        },
      },
      {
        $addFields: {
          course_duration: { $sum: "$chapters.chapter_duration" },
          quiz_count: { $size: "$topic" },
          // course_completed: { $size: "$course_complete" },
        },
      },
      {
        $project: {
          _id: 0,
          course_id: 1,
          category_id: 1,
          sub_category_id: 1,
          category_title: {
            $ifNull: [{ $arrayElemAt: ["$category.category_title", 0] }, ""],
          },
          sub_category_title: {
            $ifNull: [
              { $arrayElemAt: ["$subCategory.sub_category_title", 0] },
              "",
            ],
          },
          course_title: { $ifNull: ["$course_title", ""] },
          course_thumbnail: { $ifNull: ["$course_thumbnail", ""] },
          course_promovideo: { $ifNull: ["$course_promovideo", ""] },
          course_status: { $ifNull: ["$course_status", ""] },
          course_review_date: { $ifNull: ["$course_review_date", null] },
          course_price: { $ifNull: ["$course_price", 0] },
          course_price_type: { $ifNull: ["$course_price_type", 0] },
          course_discount: { $ifNull: ["$course_discount", 0] },
          course_tags: { $ifNull: ["$course_tags", []] },
          course_language: { $ifNull: ["$course_language", ""] },
          course_overview: { $ifNull: ["$course_overview", ""] },
          course_level: { $ifNull: ["$course_level", ""] },
          student_enrolled: { $ifNull: ["$student_enrolled", 0] },
          course_total_rating: { $ifNull: ["$course_total_rating", 0] },
          course_about: { $ifNull: ["$course_description", ""] },
          chapter_count: { $ifNull: ["$chapter_count", 0] },
          skill_gained: { $ifNull: ["$skill_gained", 0] },
          reviewed_by: { $ifNull: ["$reviewed_by", 0] },
          course_duration: { $ifNull: ["$course_duration", 0] },
          // course_completed: { $ifNull: ["$course_completed", false] },
          is_promotional: { $ifNull: ["$is_promotional", false] },
          instructor_id: { $ifNull: ["$instructor_id", ""] },
          createdAt: { $ifNull: ["$createdAt", null] },
          updatedAt: { $ifNull: ["$updatedAt", null] },
          quiz_count: 1,
          course_coupons: 1,
        },
      },
    ]);

    const getPopularCourses = await course.aggregate([
      {
        $match: {
          category_id: getCourseDetailPayload[0]?.category_id,
          sub_category_id: getCourseDetailPayload[0]?.sub_category_id,
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
          as: "subCategory",
        },
      },

      { $sort: { student_enrolled: -1 } },
      { $limit: Number(3) },
      {
        $project: {
          _id: 0,
          course_id: 1,
          category_id: 1,
          sub_category_id: 1,
          category_title: {
            $ifNull: [{ $arrayElemAt: ["$category.category_title", 0] }, ""],
          },
          sub_category_title: {
            $ifNull: [
              { $arrayElemAt: ["$subCategory.sub_category_title", 0] },
              "",
            ],
          },
          course_title: { $ifNull: ["$course_title", ""] },
          course_thumbnail: { $ifNull: ["$course_thumbnail", ""] },
          course_about: { $ifNull: ["$course_description", ""] },
          createdAt: { $ifNull: ["$createdAt", null] },
        },
      },
    ]);

    const count = await course.countDocuments();
    const response = getCourseDetailPayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          getPopularCourses: getPopularCourses,
          data: getCourseDetailPayload,
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

const getChapterAndTopics = async (instructor_id, page, limit, course_id) => {
  try {
    const skip = (page - 1) * limit;
    // const getCoursePayload = await chapter.aggregate([
    //   {
    //     $match: { course_id: course_id },
    //   },
    //   {
    //     $lookup: {
    //       from: "topics",
    //       localField: "chapter_id",
    //       foreignField: "chapter_id",
    //       as: "topics",
    //       // let: { sid: student_id },
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: "quizzes",
    //             localField: "topic_id",
    //             foreignField: "topic_id",
    //             as: "quiz",
    //             pipeline: [
    //               // {
    //               //   $lookup: {
    //               //     from: "submissions",
    //               //     localField: "quiz_id",
    //               //     foreignField: "quiz_id",
    //               //     as: "submission",
    //               //     // pipeline: [
    //               //     //   {
    //               //     //     $match: {
    //               //     //       $expr: {
    //               //     //         $eq: ["$student_id", "$$sid"],
    //               //     //       },
    //               //     //     },
    //               //     //   },
    //               //     // ],
    //               //   },
    //               // },
    //               {
    //                 $lookup: {
    //                   from: "submissions",
    //                   let: { qid: "$quiz_id" },
    //                   pipeline: [
    //                     {
    //                       $match: {
    //                         $expr: {
    //                           $eq: ["$quiz_id", "$$qid"],
    //                         },
    //                       },
    //                     },
    //                     {
    //                       $count: "count",
    //                     },
    //                   ],
    //                   as: "submission_meta",
    //                 },
    //               },
    //               {
    //                 $addFields: {
    //                   submission_count: {
    //                     $ifNull: [
    //                       { $arrayElemAt: ["$submission_meta.count", 0] },
    //                       0,
    //                     ],
    //                   },
    //                 },
    //               },
    //               {
    //                 $project: {
    //                   quiz_id: 1,
    //                   quiz_title: 1,
    //                   quiz_type: 1,
    //                   submission_count: 1,
    //                   _id: 0,
    //                 },
    //               },
    //             ],
    //           },
    //         },
    //         {
    //           $unwind: {
    //             path: "$quiz",
    //             preserveNullAndEmptyArrays: true,
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   // {
    //   //   $lookup: {
    //   //     from: "course_completions", // collection name (check exact)
    //   //     let: {
    //   //       // ch_id: "$chapter_id",
    //   //       co_id: course_id,
    //   //     },
    //   //     pipeline: [
    //   //       {
    //   //         $match: {
    //   //           $expr: {
    //   //             $and: [
    //   //               // { $eq: ["$chapter_id", "$$ch_id"] },
    //   //               { $eq: ["$student_id", student_id] },
    //   //               { $eq: ["$course_id", "$$co_id"] },
    //   //             ],
    //   //           },
    //   //         },
    //   //       },
    //   //     ],
    //   //     as: "completionData",
    //   //   },
    //   // },
    //   { $sort: { chapter_rank: 1 } },
    //   // {
    //   //   $addFields: {
    //   //     topics: {
    //   //       $map: {
    //   //         input: "$topics",
    //   //         as: "topic",
    //   //         // in: {
    //   //         //   $mergeObjects: [
    //   //         //     "$$topic",
    //   //         //     {
    //   //         //       is_completed: {
    //   //         //         $in: [
    //   //         //           { $toString: "$$topic.topic_id" },
    //   //         //           {
    //   //         //             $map: {
    //   //         //               input: "$completionData",
    //   //         //               as: "c",
    //   //         //               in: { $toString: "$$c.topic_id" },
    //   //         //             },
    //   //         //           },
    //   //         //         ],
    //   //         //       },
    //   //         //     },
    //   //         //   ],
    //   //         // },
    //   //       },
    //   //     },
    //   //   },
    //   // },
    //   // {
    //   //   $addFields: {
    //   //     is_completed: {
    //   //       $in: [
    //   //         { $toString: "$chapter_id" },
    //   //         {
    //   //           $map: {
    //   //             input: "$completionData",
    //   //             as: "c",
    //   //             in: { $toString: "$$c.chapter_id" },
    //   //           },
    //   //         },
    //   //       ],
    //   //     },
    //   //     current_chapter_rank: {
    //   //       $arrayElemAt: ["$completionData.current_chapter_rank", 0],
    //   //     },
    //   //     current_topic_rank: {
    //   //       $arrayElemAt: ["$completionData.current_topic_rank", 0],
    //   //     },
    //   //   },
    //   // },
    //   { $skip: Number(skip) },
    //   { $limit: Number(limit) },
    //   {
    //     $project: {
    //       _id: 0,
    //       course_id: 1,
    //       chapter_id: 1,
    //       chapter_title: { $ifNull: ["$chapter_title", ""] },
    //       chapter_rank: { $ifNull: ["$chapter_rank", 0] },
    //       topics: 1,
    //       chapter_duration: { $ifNull: ["$chapter_duration", 0] },
    //       createdAt: 1,
    //       updatedAt: 1,
    //     },
    //   },
    // ]);

    const getCoursePayload = await chapter.aggregate([
      {
        $match: { course_id: course_id },
      },
      {
        $lookup: {
          from: "topics",
          let: { cid: "$chapter_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$chapter_id", "$$cid"] },
              },
            },
            {
              $lookup: {
                from: "quizzes",
                let: { qid: "$quiz_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$quiz_id", "$$qid"] },
                    },
                  },
                  {
                    $lookup: {
                      from: "submissions",
                      let: { qid: "$quiz_id" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$quiz_id", "$$qid"] },
                          },
                        },
                        { $count: "count" },
                      ],
                      as: "submission_meta",
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      quiz_id: { $ifNull: ["$quiz_id", ""] },
                      quiz_title: { $ifNull: ["$quiz_title", ""] },
                      quiz_type: { $ifNull: ["$quiz_type", ""] },
                      submission_count: {
                        $ifNull: [
                          { $arrayElemAt: ["$submission_meta.count", 0] },
                          0,
                        ],
                      },
                    },
                  },
                ],
                as: "quiz",
              },
            },
            {
              $addFields: {
                quiz: {
                  $ifNull: [
                    { $arrayElemAt: ["$quiz", 0] },
                    {
                      quiz_id: "",
                      quiz_title: "",
                      quiz_type: "",
                      submission_count: 0,
                    },
                  ],
                },
              },
            },
          ],
          as: "topics",
        },
      },
      { $sort: { chapter_rank: 1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          course_id: 1,
          chapter_id: 1,
          chapter_title: { $ifNull: ["$chapter_title", ""] },
          chapter_rank: { $ifNull: ["$chapter_rank", 0] },
          topics: 1,
          chapter_duration: { $ifNull: ["$chapter_duration", 0] },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    const count = await chapter.countDocuments({ course_id: course_id });
    const response = getCoursePayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getCoursePayload,
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

const addChapter = async (course) => {
  try {
    const chapterResults = [];
    const topicResults = [];

    for (const [index, chapterData] of course.entries()) {
      const isExistingChapter = !!chapterData.chapter_id;
      const chapter_id = isExistingChapter
        ? chapterData.chapter_id
        : randomBytes(8).toString("hex");

      const chapter_duration = (chapterData.topics || []).reduce(
        (sum, t) => sum + (t.topic_duration || 0),
        0
      );

      const chapterDoc = await chapterModel.findOneAndUpdate(
        { chapter_id: chapter_id },
        {
          $set: {
            chapter_id,
            course_id: chapterData.course_id,
            chapter_title: chapterData.chapter_title,
            chapter_rank: index,
            chapter_duration,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      chapterResults.push(chapterDoc);

      for (const [index, topicData] of chapterData.topics.entries()) {
        const isExistingTopic = !!topicData.topic_id;
        const topic_id = isExistingTopic
          ? topicData.topic_id
          : randomBytes(8).toString("hex");

        const topicDoc = await topicModel.findOneAndUpdate(
          { topic_id: topic_id },
          {
            $set: {
              topic_id,
              course_id: chapterData.course_id,
              chapter_id,
              topic_title: topicData.topic_title,
              topic_rank: index,
              topic_duration: topicData.topic_duration,
              topic_type: topicData.topic_type,
              video_url: topicData.video_url || "",
              quiz_id: topicData.quiz_id || "",
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          {
            upsert: true,
            returnDocument: "after",
          }
        );

        topicResults.push(topicDoc);
      }
    }
    await courseModel.findOneAndUpdate(
      { course_id: course[0].course_id },
      {
        $inc: { chapter_count: chapterResults.length },
      }
    );

    const response = {
      status: 201,
      message: "Course content saved successfully",
      chapters: chapterResults,
      topics: topicResults,
    };
    return response;

    // return res.status(200).json({
    //   message: 'Course content saved successfully',
    //   chapters: chapterResults,
    //   topics: topicResults,
    // });
  } catch (error) {
    console.error("saveCourseContent error:", error);
    return {
      status: 412,
      message: "Internal server error",
      error: error.message,
    };
  }
};
// const addChapter = async (course_id, title, rank) => {
//   try {
//     const addChapterPayload = await chapter.create({
//       chapter_id: randomBytes(6).toString("hex"),
//       course_id: course_id,
//       chapter_title: title,
//       chapter_rank: rank,
//     });
//     await course.findOneAndUpdate(
//       { course_id: course_id },
//       { $inc: { chapter_count: 1 } }
//     );
//     const response =
//       addChapterPayload !== null
//         ? {
//           status: 201,
//           message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
//           data: addChapterPayload,
//         }
//         : {
//           status: 409,
//           message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
//           data: [],
//         };
//     return response;
//   } catch (error) {
//     return {
//       status: 412,
//       message: error.message,
//       data: [],
//     };
//   }
// };

const getAllChapter = async (instructor_id, page, limit, course_id) => {
  try {
    const skip = (page - 1) * limit;
    const getAllChapterPayload = await chapter
      .find({
        course_id: course_id,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const count = await chapter.countDocuments({ course_id: course_id });
    const response =
      getAllChapterPayload !== null
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
            count: count,
            data: getAllChapterPayload,
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

// const updateChapter = async (
//   chapter_id,
//   course_id,
//   title,
//   description,
//   rank
// ) => {
//   try {
//     const updateChapterPayload = await chapter.findOneAndUpdate(
//       { chapter_id: chapter_id },
//       {
//         course_id: course_id,
//         chapter_title: title,
//         chapter_description: description,
//         chapter_rank: rank,
//       }
//     );
//     const response =
//       updateChapterPayload !== null
//         ? {
//           status: 202,
//           message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
//           data: updateChapterPayload,
//         }
//         : {
//           status: 409,
//           message: CONSTANT.STATUS.NOT_FOUND,
//           data: [],
//         };
//     return response;
//   } catch (error) {
//     return {
//       status: 412,
//       message: error.message,
//       data: [],
//     };
//   }
// };

// const updateChapter = async (course) => {
//   try {

//     const chapterResults = [];
//     const topicResults = [];

//     for (const [index, chapterData] of course.entries()) {

//       const isExistingChapter = !!chapterData.chapter_id;
//       const chapter_id = isExistingChapter ? chapterData.chapter_id : randomBytes(8).toString("hex");

//       const chapter_duration = (chapterData.topics || []).reduce(
//         (sum, t) => sum + (t.topic_duration || 0),
//         0
//       );

//       const chapterDoc = await chapterModel.findOneAndUpdate(
//         { chapter_id: chapter_id },
//         {
//           $set: {
//             chapter_id,
//             course_id: chapterData.course_id,
//             chapter_title: chapterData.chapter_title,
//             chapter_rank: index,
//             chapter_duration,
//             updatedAt: new Date(),
//           },
//           $setOnInsert: {
//             createdAt: new Date(),
//           },
//         },
//         {
//           upsert: true,
//           returnDocument: 'after'
//         }
//       );

//       chapterResults.push(chapterDoc);

//       for (const [index, topicData] of chapterData.topics.entries()) {
//         const isExistingTopic = !!topicData.topic_id;
//         const topic_id = isExistingTopic ? topicData.topic_id : randomBytes(8).toString("hex");

//         const topicDoc = await topicModel.findOneAndUpdate(
//           { topic_id: topic_id },
//           {
//             $set: {
//               topic_id,
//               course_id: chapterData.course_id,
//               chapter_id,
//               topic_title: topicData.topic_title,
//               topic_rank: index,
//               topic_duration: topicData.topic_duration,
//               topic_type: topicData.topic_type,
//               video_url: topicData.video_url || '',
//               quiz_id: topicData.quiz_id || '',
//               updatedAt: new Date(),
//             },
//             $setOnInsert: {
//               createdAt: new Date(),
//             },
//           },
//           {
//             upsert: true,
//             returnDocument: 'after'
//           }
//         );

//         topicResults.push(topicDoc);
//       }
//     }
//     await courseModel.findOneAndUpdate({ course_id: course[0].course_id }, {
//       $inc: { chapter_count: chapterResults.length }
//     })

//     const response = {
//       status: 200,
//       message: 'Course content saved successfully',
//       chapters: chapterResults,
//       topics: topicResults,
//     }
//     return response;

//     // return res.status(200).json({
//     //   message: 'Course content saved successfully',
//     //   chapters: chapterResults,
//     //   topics: topicResults,
//     // });

//   } catch (error) {
//     console.error('saveCourseContent error:', error);
//     return ({ status: 412, message: 'Internal server error', error: error.message });
//   }
// };

const updateChapter = async (payload) => {
  try {
    // console.log(payload)
    const { course } = payload;
    const addedChapters = [];
    const updatedChapters = [];
    const addedTopics = [];
    const updatedTopics = [];

    //  const chapter_duration = (chapterData.topics || []).reduce(
    //     (sum, t) => sum + (t.topic_duration || 0),
    //     0
    //   );

    for (const chapter of course) {
      let chapterId = chapter.chapter_id;

      if (chapter.is_added) {
        chapterId = randomBytes(8).toString("hex");
        const newChapter = await chapterModel.insertOne({
          chapter_id: chapterId,
          course_id: chapter.course_id,
          chapter_title: chapter.chapter_title,
          chapter_rank: chapter.chapter_rank,
          chapter_duration: chapter.chapter_duration,
        });
        if (newChapter) addedChapters.push(newChapter);
      } else if (chapter.is_updated) {
        const updatedChapter = await chapterModel.updateOne(
          { chapter_id: chapter.chapter_id },
          {
            $set: {
              chapter_title: chapter.chapter_title,
              chapter_rank: chapter.chapter_rank,
              chapter_duration: chapter.chapter_duration,
              updatedAt: new Date(),
            },
          }
        );
        if (updatedChapter) updatedChapters.push(updatedChapter);
      }

      for (const topic of chapter.topics) {
        if (topic.is_added) {
          const newTopic = await topicModel.insertOne({
            topic_id: randomBytes(8).toString("hex"),
            chapter_id: chapterId, // use newly created or existing
            course_id: chapter.course_id,
            topic_title: topic.topic_title,
            topic_type: topic.topic_type,
            topic_rank: topic.topic_rank,
            topic_duration: topic.topic_duration,
            video_url: topic.video_url,
            quiz_id: topic.quiz_id,
            is_free_preview: topic.is_free_preview ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          if (newTopic) addedTopics.push(newTopic);
        } else {
          const updatedTopic = await topicModel.updateOne(
            { topic_id: topic.topic_id },
            {
              $set: {
                topic_title: topic.topic_title,
                topic_type: topic.topic_type,
                topic_rank: topic.topic_rank,
                topic_duration: topic.topic_duration,
                video_url: topic.video_url,
                quiz_id: topic.quiz_id,
                updatedAt: new Date(),
              },
            }
          );
          if (updatedTopic) updatedTopics.push(updatedTopic);
        }
      }
    }
    const hasChanges =
      addedChapters.length > 0 ||
      updatedChapters.length > 0 ||
      addedTopics.length > 0 ||
      updatedTopics.length > 0;

    const response = hasChanges
      ? {
          status: 202,
          message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
          data: {
            addedChapters,
            updatedChapters,
            addedTopics,
            updatedTopics,
          },
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

const deleteChapter = async (chapter_id, course_id) => {
  try {
    const deleteChapterPayload = await chapter.findOneAndDelete({
      chapter_id: chapter_id,
    });

    await course.findOneAndUpdate(
      { course_id: course_id },
      { $inc: { chapter_count: -1 } }
    );

    await topic.deleteMany({ chapter_id: chapter_id });

    const response =
      deleteChapterPayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
            data: deleteChapterPayload,
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

const getTopic = async (chapter_id, page, limit) => {
  try {
    const skip = (page - 1) * limit;
    const getTopicPayload = await topicModel
      .find({
        chapter_id: chapter_id,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const count = await topicModel.countDocuments({ chapter_id: chapter_id });
    const response =
      getTopicPayload !== null
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
            count: count,
            data: getTopicPayload,
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

const addTopic = async (
  chapter_id,
  course_id,
  title,
  description,
  rank,
  video_url,
  type,
  quiz_id,
  duration,
  is_preview
) => {
  try {
    const addTopicPayload = await topic.create({
      topic_id: randomBytes(6).toString("hex"),
      chapter_id: chapter_id,
      course_id: course_id,
      topic_title: title || "Quiz",
      topic_description: description,
      topic_rank: rank,
      video_url: video_url,
      topic_type: type,
      quiz_id: quiz_id,
      topic_duration: duration,
      is_free_preview: is_preview,
    });
    await chapter.updateOne(
      { chapter_id: chapter_id },
      {
        $inc: {
          chapter_duration: duration,
        },
      }
    );

    const response =
      addTopicPayload !== null
        ? {
            status: 201,
            message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
            data: addTopicPayload,
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

const updateTopic = async (
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
) => {
  try {
    const updateTopicPayload = await topic.findOneAndUpdate(
      { topic_id: topic_id },
      {
        chapter_id: chapter_id,
        course_id: course_id,
        topic_title: title,
        topic_description: description,
        topic_rank: rank,
        video_url: video_url,
        topic_duration: duration,
        topic_type: type,
        quiz_id: quiz_id,
        is_free_preview: is_preview,
      }
    );
    const response =
      updateTopicPayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
            data: updateTopicPayload,
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

const deleteTopic = async (topic_id, chapter_id, duration) => {
  try {
    const deleteChapterPayload = await topic.findOneAndDelete({
      topic_id: topic_id,
    });

    await chapter.updateOne(
      { chapter_id: chapter_id },
      {
        $inc: {
          chapter_duration: duration,
        },
      }
    );

    const response =
      deleteChapterPayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
            data: deleteChapterPayload,
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

const addFavourite = async (instructor_id, question_id, favourite) => {
  try {
    const addFavouritePayload = await favouriteModel.create({
      favourite_id: randomBytes(6).toString("hex"),
      instructor_id: instructor_id,
      question_id: question_id,
      favourite: favourite,
    });

    const response =
      addFavouritePayload !== null
        ? {
            status: 201,
            message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
            data: addFavouritePayload,
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

const getStudent = async (
  course_id,
  page,
  limit,
  monthFilter,
  yearFilter,
  search
) => {
  try {
    const skip = (page - 1) * limit;
    monthFilter = await getMonthMap(monthFilter);

    // const getStudentPayload = await student.aggregate([
    //   {
    //     $lookup: {
    //       from: "purchases",
    //       let: { sid: "$student_id" },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ["$student_id", "$$sid"] },
    //                 { $eq: ["$course_id", course_id] },
    //               ],
    //             },
    //           },
    //         },
    //       ],
    //       as: "purchases",
    //     },
    //   },

    //   {
    //     $match: {
    //       "purchases.0": { $exists: true },
    //       ...(monthFilter && yearFilter
    //         ? {
    //             $expr: {
    //               $and: [
    //                 {
    //                   $eq: [
    //                     {
    //                       $month: { $arrayElemAt: ["$purchases.createdAt", 0] },
    //                     },
    //                     Number(monthFilter),
    //                   ],
    //                 },
    //                 {
    //                   $eq: [
    //                     {
    //                       $year: { $arrayElemAt: ["$purchases.createdAt", 0] },
    //                     },
    //                     Number(yearFilter),
    //                   ],
    //                 },
    //               ],
    //             },
    //           }
    //         : {}),
    //       ...(search
    //         ? {
    //             $or: [
    //               { student_first_name: { $regex: search, $options: "i" } },
    //               { student_last_name: { $regex: search, $options: "i" } },
    //             ],
    //           }
    //         : {}),
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "chapters",
    //       pipeline: [
    //         {
    //           $match: {
    //             course_id: course_id,
    //           },
    //         },
    //       ],
    //       as: "chapter",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "quizzes",
    //       pipeline: [
    //         {
    //           $match: {
    //             course_id: course_id,
    //           },
    //         },
    //       ],
    //       as: "quizzes",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "submissions",
    //       let: { sid: "$student_id", quizIds: "$quizzes.quiz_id" },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ["$student_id", "$$sid"] },
    //                 { $in: ["$quiz_id", "$$quizIds"] }, // Only submissions for this course's quizzes
    //               ],
    //             },
    //           },
    //         },
    //       ],
    //       as: "submission",
    //     },
    //   },

    //   {
    //     $lookup: {
    //       from: "course_completions",
    //       let: { sid: "$student_id", cid: course_id },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ["$student_id", "$$sid"] },
    //                 { $eq: ["$course_id", "$$cid"] },
    //                 { $eq: ["$chapter_status", "completed"] },
    //               ],
    //             },
    //           },
    //         },
    //       ],
    //       as: "chapter_completed",
    //     },
    //   },

    //   {
    //     $addFields: {
    //       chapter_count: { $size: "$chapter" },
    //       completed_chapters_count: {
    //         $size: { $ifNull: ["$chapter_completed", []] },
    //       },
    //       avg_score: {
    //         $cond: [
    //           { $eq: [{ $size: "$submission" }, 0] },
    //           0,
    //           {
    //             $divide: [
    //               { $sum: "$submission.total_score" },
    //               { $size: "$submission" },
    //             ],
    //           },
    //         ],
    //       },
    //     },
    //   },
    //   {
    //     $addFields: {
    //       course_progress: {
    //         $cond: {
    //           if: { $eq: ["$chapter_count", 0] },
    //           then: 0,
    //           else: {
    //             $divide: ["$completed_chapters_count", "$chapter_count"],
    //           },
    //         },
    //       },
    //     },
    //   },

    //   { $skip: Number(skip) },
    //   { $limit: Number(limit) },
    //   {
    //     $facet: {
    //       metadata: [{ $count: "total" }],
    //       data: [
    //         {
    //           $project: {
    //             _id: 0,
    //             student_id: { $ifNull: ["$student_id", ""] },
    //             student_first_name: { $ifNull: ["$student_first_name", ""] },
    //             student_last_name: { $ifNull: ["$student_last_name", ""] },
    //             student_avatar: { $ifNull: ["$student_avatar", ""] },
    //             enrolledAt: { $arrayElemAt: ["$purchases.createdAt", 0] },
    //             student_country: 1,
    //             student_state: 1,
    //             course_progress: 1,
    //             avg_score: 1,
    //           },
    //         },
    //       ],
    //     },
    //   },
    // ]);

    const result = await student.aggregate([
      {
        $lookup: {
          from: "purchases",
          let: { sid: "$student_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$student_id", "$$sid"] },
                    { $eq: ["$course_id", course_id] },
                  ],
                },
              },
            },
            // ✅ Apply date filter INSIDE lookup (better)
            ...(monthFilter && yearFilter
              ? [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              { $month: "$createdAt" },
                              Number(monthFilter),
                            ],
                          },
                          {
                            $eq: [{ $year: "$createdAt" }, Number(yearFilter)],
                          },
                        ],
                      },
                    },
                  },
                ]
              : []),
          ],
          as: "purchases",
        },
      },

      {
        $match: {
          "purchases.0": { $exists: true },

          ...(search && {
            $or: [
              { student_first_name: { $regex: search, $options: "i" } },
              { student_last_name: { $regex: search, $options: "i" } },
            ],
          }),
        },
      },

      // ✅ Move heavy lookups AFTER filtering
      {
        $lookup: {
          from: "chapters",
          pipeline: [{ $match: { course_id: course_id } }],
          as: "chapter",
        },
      },
      {
        $lookup: {
          from: "quizzes",
          pipeline: [{ $match: { course_id: course_id } }],
          as: "quizzes",
        },
      },
      {
        $lookup: {
          from: "submissions",
          let: { sid: "$student_id", quizIds: "$quizzes.quiz_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$student_id", "$$sid"] },
                    { $in: ["$quiz_id", "$$quizIds"] },
                  ],
                },
              },
            },
          ],
          as: "submission",
        },
      },
      {
        $lookup: {
          from: "course_completions",
          let: { sid: "$student_id", cid: course_id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$student_id", "$$sid"] },
                    { $eq: ["$course_id", "$$cid"] },
                    { $eq: ["$chapter_status", "completed"] },
                  ],
                },
              },
            },
          ],
          as: "chapter_completed",
        },
      },

      {
        $addFields: {
          chapter_count: { $size: "$chapter" },
          completed_chapters_count: {
            $size: { $ifNull: ["$chapter_completed", []] },
          },
          avg_score: {
            $cond: [
              { $eq: [{ $size: "$submission" }, 0] },
              0,
              {
                $divide: [
                  { $sum: "$submission.total_score" },
                  { $size: "$submission" },
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          course_progress: {
            $cond: {
              if: { $eq: ["$chapter_count", 0] },
              then: 0,
              else: {
                $divide: ["$completed_chapters_count", "$chapter_count"],
              },
            },
          },
        },
      },

      // ✅ Correct placement of $facet
      {
        $facet: {
          data: [
            { $skip: Number(skip) },
            { $limit: Number(limit) },
            {
              $project: {
                _id: 0,
                student_id: { $ifNull: ["$student_id", ""] },
                student_first_name: { $ifNull: ["$student_first_name", ""] },
                student_last_name: { $ifNull: ["$student_last_name", ""] },
                student_avatar: { $ifNull: ["$student_avatar", ""] },
                enrolledAt: { $arrayElemAt: ["$purchases.createdAt", 0] },
                student_country: 1,
                student_state: 1,
                course_progress: 1,
                avg_score: 1,
              },
            },
          ],
          metadata: [{ $count: "total" }],
        },
      },
    ]);

    const getStudentPayload = result.length > 0 ? result[0].data : [];

    const count =
      result.length > 0 && result[0].metadata.length > 0
        ? result[0].metadata[0].total
        : 0;

    const response =
      getStudentPayload.length !== 0
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
            count: count,
            data: getStudentPayload,
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

// const getQuizAnalytics = async (instructor_id, course_id) => {
//   try {
//     const getQuizAnalyticsPayload = await course.aggregate([
//       {
//         $match: {
//           course_id: course_id,
//           instructor_id: instructor_id,
//         },
//       },
//       {
//         $lookup: {
//           from: "topics",
//           pipeline: [{ $match: { course_id: course_id } }],
//           as: "topics",
//         },
//       },
//       {
//         $lookup: {
//           from: "submissions",
//           let: { quizIds: "$topics.quiz_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $in: ["$quiz_id", "$$quizIds"] },
//               },
//             },
//           ],
//           as: "submissions",
//         },
//       },
//       {
//         $lookup: {
//           from: "quizzes",
//           pipeline: [
//             {
//               $match: {
//                 instructor_id: instructor_id,
//               },
//             },
//           ],
//           as: "quizzes",
//         },
//       },
//       {
//         $lookup: {
//           from: "students",
//           let: {
//             studentIds: "$submissions.student_id",
//             quizIds: "$topics.quiz_id",
//           },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $in: ["$student_id", "$$studentIds"] },
//               },
//             },
//             {
//               $lookup: {
//                 from: "submissions",
//                 let: {
//                   sid: "$student_id",
//                   qids: "$$quizIds",
//                 },
//                 pipeline: [
//                   {
//                     $match: {
//                       $expr: {
//                         $and: [
//                           { $eq: ["$student_id", "$$sid"] },
//                           { $in: ["$quiz_id", "$$qids"] },
//                         ],
//                       },
//                     },
//                   },
//                 ],
//                 as: "student_submission",
//               },
//             },
//             {
//               $project: {
//                 _id: 0,
//                 student_id: 1,
//                 student_first_name: 1,
//                 student_last_name: 1,
//                 student_avatar: 1,
//                 student_total_score: {
//                   $sum: "$student_submission.total_score",
//                 },
//                 student_total_points: {
//                   $sum: "$student_submission.quiz_total_points",
//                 },
//               },
//             },
//             { $sort: { student_total_score: -1 } },
//             {
//               $setWindowFields: {
//                 sortBy: { student_total_score: -1 },
//                 output: { rank: { $rank: {} } },
//               },
//             },
//             { $match: { rank: { $lte: 3 } } },
//           ],
//           as: "top_students",
//         },
//       },
//       {
//         $addFields: {
//           total_enrolled: { $multiply: ["$student_enrolled", 2] },
//           total_submission: { $size: "$submissions" },
//           total_points: { $sum: "$submissions.quiz_total_points" },
//           obtained_score: { $sum: "$submissions.total_score" },
//         },
//       },

//       {
//         $project: {
//           _id: 0,
//           total_quizs: { $size: "$quizzes" },
//           total_submission: 1,
//           total_enrolled: 1,
//           total_points: 1,
//           obtained_score: 1,
//           top_students: 1,
//           completion_rate: {
//             $round: [
//               {
//                 $multiply: [
//                   {
//                     $cond: {
//                       if: { $gt: ["$total_enrolled", 0] },
//                       then: {
//                         $divide: ["$total_submission", "$total_enrolled"],
//                       },
//                       else: 0,
//                     },
//                   },
//                   100,
//                 ],
//               },
//               1,
//             ],
//           },
//           accuracy_rate: {
//             $round: [
//               {
//                 $multiply: [
//                   {
//                     $cond: {
//                       if: { $gt: ["$total_points", 0] },
//                       then: { $divide: ["$obtained_score", "$total_points"] },
//                       else: 0,
//                     },
//                   },
//                   100,
//                 ],
//               },
//               1,
//             ],
//           },
//         },
//       },
//     ]);

//     let response =
//       getQuizAnalyticsPayload.length > 0
//         ? {
//             status: 200,
//             message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
//             data: getQuizAnalyticsPayload,
//           }
//         : {
//             status: 409,
//             message: CONSTANT.STATUS.NOT_FOUND,
//             data: [],
//           };

//     return response;
//   } catch (error) {
//     return {
//       status: 412,
//       message: error.message,
//       data: [],
//     };
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
