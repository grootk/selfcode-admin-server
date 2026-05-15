const { mongoManager, CONSTANT } = require("../../packages/manager");
const bcrypt = require("bcrypt");
const { randomBytes } = require("crypto");
const jwtoken = require("jsonwebtoken");
const review = require("../model/reviews.model");
const instructor = require("../model/instructor.model");
const course = require("../model/course.model");
const announcementModel = require("../model/announcement.model");
// const { getAnnouncement } = require("./review.controller");
const { pipeline } = require("stream");
const reviewsModel = require("../model/reviews.model");
const { count } = require("console");

mongoManager.connect();

const addReview = async (
  student_id,
  instructor_id,
  course_id,
  rating,
  feedback
) => {
  try {
    // const {
    //     instructor_id, course_id, rating, feedback
    // } = payload;

    const addReviewPayload = await review.create({
      review_id: randomBytes(6).toString("hex"),
      student_id: student_id,
      instructor_id: instructor_id,
      course_id: course_id,
      review_rating: rating,
      review_feedback: feedback,
    });

    if (student_id && instructor_id) {
      await instructor.findOneAndUpdate(
        { instructor_id: instructor_id },
        {
          $inc: {
            reviewed_by: 1,
            total_rating: rating,
          },
        }
      );
    }

    if (student_id && course_id) {
      await course.findOneAndUpdate(
        { course_id: course_id },
        {
          $inc: {
            reviewed_by: 1,
            course_total_rating: rating,
          },
        }
      );
    }
    return {
      status: 201,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: addReviewPayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const getReview = async (
  course_id,
  page,
  limit,
  sort_by,
  student_id,
  search
) => {
  try {
    let checkMatch = {};
    let sortFormatt = null;
    let otherCourse = [];

    if (sort_by === "pinned") {
      checkMatch.is_testimonial = true;
    } else if (sort_by === "top") {
      sortFormatt = { $sort: { course_rating: -1 } };
    } else if (sort_by === "lowest") {
      sortFormatt = { $sort: { course_rating: 1 } };
    } else {
      checkMatch = {};
      sortFormatt = { $sort: { is_testimonial: -1 } };
    }

    if (student_id) {
      checkMatch.student_id = student_id;
    }
    if (course_id) {
      checkMatch.course_id = course_id;
    }
    const skip = (page - 1) * limit;
    // const getReviewPayload = await review.aggregate([
    //   {
    //     $match: {
    //       course_id: course_id,
    //       ...checkMatch,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "students",
    //       localField: "student_id",
    //       foreignField: "student_id",
    //       as: "student",
    //     },
    //   },
    //   { $skip: Number(skip) },
    //   { $limit: Number(limit) },
    //   ...(sortFormatt ? [sortFormatt] : []),
    //   {
    //     $project: {
    //       review_id: 1,
    //       student_id: 1,
    //       course_id: 1,
    //       student_firstname: {
    //         $arrayElemAt: ["$student.student_first_name", 0],
    //       },
    //       student_lastname: {
    //         $arrayElemAt: ["$student.student_last_name", 0],
    //       },
    //       student_avatar: {
    //         $arrayElemAt: ["$student.student_avatar", 0],
    //       },
    //       review_feedback: 1,
    //       course_rating: 1,
    //       instructor_rating: 1,
    //       createdAt: 1,
    //       is_testimonial: 1,
    //     },
    //   },
    // ]);

    const result = await review.aggregate([
      {
        $match: {
          ...checkMatch,
        },
      },
      {
        $facet: {
          reviews: [
            {
              $lookup: {
                from: "students",
                localField: "student_id",
                foreignField: "student_id",
                as: "student",
              },
            },
            ...(search
              ? [
                  {
                    $match: {
                      $or: [
                        {
                          "student.student_first_name": {
                            $regex: search,
                            $options: "i",
                          },
                        },
                        {
                          "student.student_last_name": {
                            $regex: search,
                            $options: "i",
                          },
                        },
                      ],
                    },
                  },
                ]
              : []),
            { $skip: Number(skip) },
            { $limit: Number(limit) },
            ...(sortFormatt ? [sortFormatt] : []),
            {
              $project: {
                review_id: 1,
                student_id: 1,
                course_id: 1,
                student_firstname: {
                  $arrayElemAt: ["$student.student_first_name", 0],
                },
                student_lastname: {
                  $arrayElemAt: ["$student.student_last_name", 0],
                },
                student_avatar: {
                  $ifNull: [
                    { $arrayElemAt: ["$student.student_avatar", 0] },
                    null,
                  ],
                },
                review_feedback: 1,
                course_rating: 1,
                instructor_rating: 1,
                createdAt: 1,
                is_testimonial: 1,
              },
            },
          ],
          stats: [
            {
              $group: {
                _id: null,
                avg_course_rating: { $avg: "$course_rating" },
                total_reviews: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const getReviewPayload = result[0].reviews;
    const avgRating = result[0].stats[0]?.avg_course_rating || 0;
    const totalCount = result[0].stats[0]?.total_reviews || 0;

    if (student_id) {
      // console.log("kjhgfdxchj");
      otherCourse = await course.aggregate([
        {
          $lookup: {
            from: "purchases",
            let: { course_id: "$course_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$course_id", "$$course_id"] },
                      { $eq: ["$student_id", student_id] },
                    ],
                  },
                },
              },
            ],
            as: "enrollment",
          },
        },
        {
          $match: {
            enrollment: { $ne: [] },
          },
        },
        {
          $lookup: {
            from: "reviews",
            let: { course_id: "$course_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$course_id", "$$course_id"] },
                      // { $ne: ["$course_id", course_id] },
                      { $eq: ["$student_id", student_id] },
                    ],
                  },
                },
              },
            ],
            as: "reviews",
          },
        },
        // {
        //     $lookup: {
        //         from: "students",
        //         localField: "reviews.student_id",
        //         foreignField: "student_id",
        //         as: "students"
        //     }
        // },
        //  { $match: { student_id:"$students.student_id" } },
        {
          $lookup: {
            from: "course_completions",
            let: { course_id: "$course_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$course_status", "completed"] },
                      { $eq: ["$student_id", student_id] },
                      { $eq: ["$$course_id", "$course_id"] },
                    ],
                  },
                },
              },
            ],
            as: "completions",
          },
        },
        {
          $addFields: {
            total_chapter: { $sum: "$chapter_count" },
            completedChapter: { $size: "$completions" },
          },
        },
        {
          $addFields: {
            course_progress: {
              $cond: {
                if: { $eq: ["$total_chapter", 0] },
                then: 0,
                else: {
                  $multiply: [
                    { $divide: ["$completedChapter", "$total_chapter"] },
                    100,
                  ],
                },
              },
            },
          },
        },

        {
          $project: {
            course_id: 1,
            student_id: { $arrayElemAt: ["$reviews.student_id", 0] },
            course_name: { $ifNull: ["$course_title", ""] },
            course_rating: {
              $ifNull: [{ $arrayElemAt: ["$reviews.course_rating", 0] }, 0],
            },
            instructor_rating: {
              $ifNull: [{ $arrayElemAt: ["$reviews.instructor_rating", 0] }, 0],
            },
            course_thumbnail: 1,
            total_chapter: 1,
            completedChapter: 1,
            course_progress: 1,
          },
        },
      ]);
    }

    return {
      status: 200,
      message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
      count: totalCount,
      course_rating: avgRating,
      otherCourse: otherCourse,
      data: getReviewPayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const pinReview = async (
  review_id,
  instructor_id,
  is_testimonial,
  course_id
) => {
  try {
    const totalPinedReviews = await reviewsModel.find({
      course_id: course_id,
      is_testimonial: true,
    });
    if (totalPinedReviews?.length > 4) {
      return {
        status: 409,
        message: "you have already pinned 5 comments.",
        data: [],
      };
    }
    const pinReviewPayload = await reviewsModel.findOneAndUpdate(
      {
        review_id: review_id,
      },
      {
        is_testimonial: is_testimonial,
      }
    );
    return {
      status: 202,
      message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
      data: pinReviewPayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const addAnnouncement = async (
  instructor_id,
  course_id,
  message,
  subject,
  status,
  student_id
) => {
  try {
    const addAnnouncementPayload = await announcementModel.create({
      announcement_id: randomBytes(6).toString("hex"),
      instructor_id: instructor_id,
      course_id: course_id,
      announcement_message: message,
      announcement_subject: subject,
      announcement_status: status,
      student_ids: student_id,
    });
    return {
      status: 201,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: addAnnouncementPayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const updateAnnouncement = async (
  announcement_id,
  instructor_id,
  course_id,
  message,
  subject,
  status,
  student_id
) => {
  try {
    const updateAnnouncementPayload = await announcementModel.findOneAndUpdate(
      {
        announcement_id: announcement_id,
      },
      {
        instructor_id: instructor_id,
        course_id: course_id,
        announcement_message: message,
        announcement_subject: subject,
        announcement_status: status,
        student_ids: student_id,
      }
    );

    return {
      status: 202,
      message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
      data: updateAnnouncementPayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const getAnnouncement = async (course_id, sort_by, page, limit, search) => {
  try {
    const skip = (page - 1) * limit;
    const getAnnouncementPayload = await announcementModel.aggregate([
      {
        $match: {
          course_id: course_id,
          ...(sort_by === "active" && { announcement_status: "active" }),
          ...(search && {
            announcement_subject: { $regex: search, $options: "i" },
          }),
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "course_id",
          foreignField: "course_id",
          as: "courses",
        },
      },
      {
        $skip: Number(skip),
      },
      {
        $limit: Number(limit),
      },
      {
        $project: {
          course_id: 1,
          course_name: { $arrayElemAt: ["$courses.course_title", 0] },
          course_thumbnail: { $arrayElemAt: ["$courses.course_thumbnail", 0] },
          announcement_id: 1,
          announcement_subject: 1,
          announcement_status: 1,
          students: 1,
        },
      },
    ]);

    const count = await announcementModel.countDocuments({
      course_id: course_id,
      ...(sort_by === "active" && { announcement_status: "active" }),
      ...(search && {
        announcement_subject: { $regex: search, $options: "i" },
      }),
    });

    return getAnnouncementPayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getAnnouncementPayload,
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

const getAnnouncementDetail = async (announcement_id, sort_by) => {
  try {
    let checkMatch = {};
    if (sort_by == "active") {
      checkMatch.announcement_status = "active";
    }
    // const skip = (page - 1) * limit;
    const getAnnouncementPayload = await announcementModel.aggregate([
      {
        $match: {
          announcement_id: announcement_id,
          ...checkMatch,
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "course_id",
          foreignField: "course_id",
          as: "courses",
        },
      },
      {
        $lookup: {
          from: "students",
          let: { studentIds: "$student_ids" }, // ✅ Capture parent doc's student_ids
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$student_id", "$$studentIds"], // ✅ Reference via $$
                },
              },
            },
            {
              $project: {
                _id: 0,
                student_id: 1,
                student_first_name: 1,
                student_last_name: 1,
                student_avatar: 1,
                student_country: 1,
                student_state: 1,
                createdAt: 1,
              },
            },
          ],
          as: "students",
        },
      },
      {
        $project: {
          course_id: 1,
          announcement_id: 1,
          announcement_message: 1,
          announcement_status: 1,
          announcement_subject: 1,
          students: 1,
          course_title: { $arrayElemAt: ["$courses.course_title", 0] },
        },
      },
    ]);

    return {
      status: 200,
      message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
      data: getAnnouncementPayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const deleteAnnouncement = async (announcement_id) => {
  try {
    const deleteAnnouncementPayload = await announcementModel.findOneAndDelete({
      announcement_id: announcement_id,
    });

    return {
      status: 202,
      message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
      data: deleteAnnouncementPayload,
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
  getReview,
  pinReview,
  addAnnouncement,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementDetail,
};
