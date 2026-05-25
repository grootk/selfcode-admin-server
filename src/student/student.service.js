const { randomBytes } = require("crypto");
const bcrypt = require("bcrypt");
const jwtoken = require("jsonwebtoken");
const { CONSTANT } = require("../../packages/constants");
const { mongoManager } = require("../../packages/manager");
const student = require("../model/student.model");
const purchase = require("../model/purchase.model");
const course = require("../model/course.model");
const courseCompletionModel = require("../model/courseCompletion.model");
const chapter = require("../model/chapter.model");
const topic = require("../model/topic.model");
const certificate = require("../model/certificate.model");
const { getMonthMap } = require("../../packages/handlers");
const { pipeline } = require("stream");

mongoManager.connect();

const authToken = async (student_id) => {
  let jwtSecretKey = auth.secretkey;

  let data = {
    time: Date(),
    student_id: student_id,
  };

  const token = jwtoken.sign(data, jwtSecretKey);
  return token;
};

const sendVerificationEmail = async (name, email, verificationToken) => {
  const verificationUrl = `${url}/verify-email?token=${verificationToken}`;
  const sesClient = new SESv2Client({
    region: aws.region,
    credentials: {
      accessKeyId: aws.accessKey,
      secretAccessKey: aws.secretKey,
    },
  });

  const params = {
    Destination: { ToAddresses: [email] },
    FromEmailAddress: ses.sesAddress,
    Content: {
      Simple: {
        Subject: {
          Charset: "UTF-8",
          Data: "Verify Link to Reset Password!",
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
              <html>
                <body>
                  <h1>Hi ${name}!</h1>
                  <p>We've recieved a request to reset your password.</p>
                  <p><a href="${verificationUrl}">Verify Email</a></p>
                  <p>If you did not request to reset password,please ignore this email.Otherwise,you can change your password.</p>
                </body>
              </html>
            `,
          },
          Text: {
            Charset: "UTF-8",
            Data: `Please verify your email by clicking the link: ${verificationUrl}`,
          },
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    return {
      status: 200,
      message: CONSTANT.PASSWORD.RESET_LINK_SEND_SUCCESSFULLY,
      data: [],
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      status: 500,
      message: "Failed to send verification email.",
      error: error.message,
    };
  }
};

const sendOtp = async (email, otp) => {
  const sesClient = new SESv2Client({
    region: aws.region,
    credentials: { accessKeyId: aws.accessKey, secretAccessKey: aws.secretKey },
  });

  const otpCode = otp;
  const params = {
    Destination: { ToAddresses: [email] },
    FromEmailAddress: ses.sesAddress,
    Content: {
      Simple: {
        Subject: {
          Charset: "UTF-8",
          Data: "Pixel Rings student OTP-Verification",
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `<html>
                    <body>
                      <p>Your one-time OTP code:</p>
                      <h3>${otpCode}</h3>
                    </body>
                  </html>`,
          },
          Text: {
            Charset: "UTF-8",
            Data: `Your one-time OTP code: ${otpCode}`,
          },
        },
      },
    },
  };

  try {
    const otpResponse = await sesClient.send(new SendEmailCommand(params));
    return {
      status: 200,
      message: CONSTANT.COGNITO.OTP_SEND_SUCCESSFULLY,
      data: [],
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return { status: 500, message: "Failed to send OTP email." };
  }
};

const signUp = async (
  student_id,
  first_name,
  last_name,
  email,
  password,
  phone_no,
  gender,
  about,
  country,
  state
) => {
  try {
    // const { name, email, password, phone_no, gender,about } = payload;

    const saltRound = 10;
    const hashPassword = await bcrypt.hash(password, saltRound);

    const signUpPayload = await student.create({
      student_id: student_id, //randomBytes(6).toString("hex"),
      student_first_name: first_name,
      student_last_name: last_name,
      student_email: email,
      student_phone_no: phone_no,
      student_password: hashPassword,
      student_gender: gender,
      student_about: about,
      student_country: country,
      student_state: state,
    });

    return {
      status: 201,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: signUpPayload,
    };
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      let message = CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST;

      if (field === "student_email") {
        message = CONSTANT.DATABASE_ERROR.USEREMAIL;
      } else if (field === "student_phone_no") {
        message = CONSTANT.DATABASE_ERROR.USERPHONENO;
      }

      return {
        status: 409,
        message,
        data: null,
      };
    }

    return {
      status: 500,
      message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
      error: error,
      data: null,
    };
  }
};
const login = async (email, password) => {
  try {
    // const { email, password } = payload;
    let hashPassword;

    if (email && password) {
      hashPassword = await student
        .findOne(
          { student_email: email },
          { _id: 0, student_id: 1, student_password: 1, student_email: 1 }
        )
        .lean();
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      hashPassword.student_password
    );

    if (!isPasswordValid) {
      return {
        status: 409,
        message: CONSTANT.STATUS.INVALID_CREDS,
        data: [],
      };
    }

    const token = await authToken(hashPassword?.student_id);
    const loginPayload = await student.updateOne(
      { student_id: hashPassword?.student_id },
      { studentAuthToken: token }
    );

    const response =
      loginPayload !== null
        ? {
            status: 201,
            message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
            data: token,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 500,
      message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
      error: error,
      data: null,
    };
  }
};

// const getProfile = async (student_id) => {
//   try {
//     const getProfilePayload = await student.aggregate([
//       // {
//       //   $match: { student_id: student_id },
//       // },
//       {
//         $lookup: {
//           from: "purchases",
//           localField: "student_id",
//           foreignField: "student_id",
//           as: "purchases"
//         }
//       },
//       {
//         $lookup: {
//           from: "submissions",
//           localField: "student_id",
//           foreignField: "student_id",
//           as: "submission"
//         }
//       },
//       // {
//       //   $lookup: {
//       //     from: "course_completions",
//       //     let: { sid: "$student_id" },
//       //     pipeline: [
//       //       {
//       //         $match: {
//       //           $expr: {
//       //             $and: [
//       //               { $eq: ["$student_id", "$$sid"] },
//       //               { $eq: ["$course_status", "completed"] },
//       //             ],
//       //           },
//       //         },
//       //       },
//       //     ],
//       //     as: "chapter_completed",
//       //   },
//       // },
//       {
//         $addFields: {
//           course_count: { $size: "$purchases" },
//           completed_chapters_count: {
//             $size: { $ifNull: ["$course_completed", []] },
//           },
//           // obtained_marks:{$sum:"$submission.total_score"},
//         avg_score: {
//         $cond: [
//           { $eq: [{ $size: "$submission" }, 0] },
//           0,
//           { $divide: [{ $sum: "$submission.total_score" }, { $size: "$submission" }] }
//         ]
//       },

//       // Average of the total possible marks per quiz/submission
//       avg_total_marks: {
//         $cond: [
//           { $eq: [{ $size: "$submission" }, 0] },
//           0,
//           { $divide: [{ $sum: "$submission.quiz_total_points" }, { $size: "$submission" }] }
//         ]
//       }
//     // }
//   // },
//         }
//       },
//       {
//         $addFields: {
//           course_progress: {
//             $cond: {
//               if: { $eq: ["$course_count", 0] },
//               then: 0,
//               else: {
//                 $divide: ["$completed_chapters_count", "$course_count"],
//               },
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           student_id: { $ifNull: ["$student_id", ""] },
//           student_first_name: { $ifNull: ["$student_first_name", ""] },
//           student_last_name: { $ifNull: ["$student_last_name", ""] },
//           student_email: { $ifNull: ["$student_email", ""] },
//           student_phone_no: { $ifNull: ["$student_phone_no", ""] },
//           student_avatar: { $ifNull: ["$student_avatar", ""] },
//           student_gender: { $ifNull: ["$student_gender", ""] },
//           // avg_score: { $ifNull: ["$avg_score", 0] },
//           course_count: 1,
//           certificate_earned: { $ifNull: ["$certificate_earned", 0] },
//           badge_count: { $ifNull: ["$badge_count", 0] },
//           createdAt: 1,
//           student_type: "student",
//           student_country: 1,
//           student_state: 1,
//           createdAt: 1,
//           course_progress: 1,
//           // obtained_marks:1,
//           // total_marks:1,
//           avg_score:1,
//           avg_total_marks:1,
//           profile_progress:"50%"
//         }
//       }
//     ])
//     // .findOne(
//     //   { student_id: student_id },
//     //   {
//     //     _id: 0,
//     //     student_id: { $ifNull: ["$student_id", ""] },
//     //     student_first_name: { $ifNull: ["$student_first_name", ""] },
//     //     student_last_name: { $ifNull: ["$student_last_name", ""] },
//     //     student_email: { $ifNull: ["$student_email", ""] },
//     //     student_phone_no: { $ifNull: ["$student_phone_no", ""] },
//     //     student_avatar: { $ifNull: ["$student_avatar", ""] },
//     //     student_gender: { $ifNull: ["$student_gender", ""] },
//     //     avg_score: { $ifNull: ["$avg_score", 0] },
//     //     course_count: { $ifNull: ["$course_count", 0] },
//     //     certificate_earned: { $ifNull: ["$certificate_earned", 0] },
//     //     badge_count: { $ifNull: ["$badge_count", 0] },
//     //     createdAt: 1,
//     //     student_type: "student",
//     //     student_country:1,
//     //     student_state:1,
//     //   }
//     // )
//     // .lean();

//     const response =
//       getProfilePayload !== null
//         ? {
//           status: 200,
//           message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
//           data: getProfilePayload[0],
//         }
//         : {
//           status: 409,
//           message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
//           data: [],
//         };
//     return response;
//   } catch (error) {
//     return {
//       status: 500,
//       message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
//       error: error,
//       data: null,
//     };
//   }
// };

const getStudentList = async (
  student_id,
  page,
  limit,
  monthFilter,
  yearFilter,
  status,
  search
) => {
  try {
    const skip = (page - 1) * limit;

    let matchStage = {};

    if (search) {
      matchStage = {
        $or: [
          { student_first_name: { $regex: search, $options: "i" } },
          { student_last_name: { $regex: search, $options: "i" } },
          { student_email: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (status) {
      matchStage.student_status = status;
    }

    if (student_id) {
      matchStage.student_id = student_id;
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

    const data = await student.aggregate([
      { $match: { ...matchStage, ...timeCheck } },

      {
        $lookup: {
          from: "purchases",
          localField: "student_id",
          foreignField: "student_id",
          as: "purchases",
        },
      },
      {
        $lookup: {
          from: "submissions",
          let: { sid: "$student_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$student_id", "$$sid"] },
              },
            },
            { $sort: { createdAt: -1 } },
            // ✅ pick latest attempt per quiz
            {
              $group: {
                _id: "$quiz_id",
                doc: { $first: "$$ROOT" },
              },
            },
            { $replaceRoot: { newRoot: "$doc" } },
          ],
          as: "submission",
        },
      },
      {
        $lookup: {
          from: "course_completions",
          let: { sid: "$student_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$student_id", "$$sid"] },
                    { $eq: ["$course_status", "completed"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$course_id", // ✅ unique courses only
              },
            },
          ],
          as: "completed_courses",
        },
      },
      {
        $addFields: {
          course_count: { $size: "$purchases" },

          completed_chapters_count: {
            $size: { $ifNull: ["$course_completed", []] },
          },
          avg_score: {
            $cond: [
              { $eq: [{ $size: "$submission" }, 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $sum: "$submission.total_score" },
                          { $sum: "$submission.quiz_total_points" },
                        ],
                      },
                      10,
                    ],
                  },
                  2,
                ],
              },
            ],
          },
          avg_total_marks: {
            $cond: [
              { $eq: [{ $size: "$submission" }, 0] },
              0,
              {
                $round: [
                  {
                    $divide: [
                      { $sum: "$submission.quiz_total_points" },
                      { $size: "$submission" },
                    ],
                  },
                  2,
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          total_courses: { $size: { $ifNull: ["$purchases", []] } },
          completed_courses_count: {
            $size: { $ifNull: ["$completed_courses", []] },
          },
        },
      },
      {
        $addFields: {
          course_progress: {
            $cond: {
              if: { $eq: ["$total_courses", 0] },
              then: 0,
              else: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: ["$completed_courses_count", "$total_courses"],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          basket_size: {
            $cond: [
              { $gt: [{ $size: "$purchases" }, 0] },
              {
                $round: [
                  {
                    $divide: [
                      {
                        $sum: {
                          $map: {
                            input: {
                              $filter: {
                                input: "$purchases",
                                as: "p",
                                cond: { $ne: ["$$p.if_free", true] },
                              },
                            },
                            as: "p",
                            in: "$$p.course_amount",
                          },
                        },
                      },
                      {
                        $size: {
                          $filter: {
                            input: "$purchases",
                            as: "p",
                            cond: { $ne: ["$$p.if_free", true] },
                          },
                        },
                      },
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          student_id: 1,
          student_first_name: { $ifNull: ["$student_first_name", ""] },
          student_last_name: { $ifNull: ["$student_last_name", ""] },
          student_email: { $ifNull: ["$student_email", ""] },
          student_phone_no: { $ifNull: ["$student_phone_no", ""] },
          student_avatar: { $ifNull: ["$student_avatar", ""] },
          student_gender: { $ifNull: ["$student_gender", ""] },
          student_status: { $ifNull: ["$student_status", ""] },
          basket_size: 1,
          course_count: 1,
          createdAt: 1,
          student_type: "student",
          student_country: 1,
          student_state: 1,
          course_progress: 1,
          avg_score: 1,
          avg_total_marks: 1,
        },
      },

      { $skip: Number(skip) },
      { $limit: Number(limit) },
    ]);

    const total = await student.countDocuments({ ...matchStage, ...timeCheck });

    const suspendedCount = await student.countDocuments({
      student_status: CONSTANT.STATUS.SUSPENDED,
      ...timeCheck,
    });
    const activeCount = await student.countDocuments({
      student_status: CONSTANT.STATUS.ACTIVE,
      ...timeCheck,
    });
    const inActiveCount = await student.countDocuments({
      student_status: CONSTANT.STATUS.INACTIVE,
      ...timeCheck,
    });

    return data.length
      ? {
          status: 200,
          message: "Student list fetched successfully",
          count: total,
          suspendedCount: suspendedCount,
          activeCount: activeCount,
          inActiveCount: inActiveCount,
          data: data,
        }
      : {
          status: 409,
          message: CONSTANT.STATUS.NOT_FOUND,
          data: [],
        };
  } catch (error) {
    return {
      status: 412,
      message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
      error: error.message,
    };
  }
};

const updateStatus = async (student_id, status) => {
  try {
    const updateStatusPayload = await student.updateMany(
      { student_id: { $in: student_id } },
      {
        student_status: status,
      },
      { new: true }
    );

    const response =
      updateStatusPayload !== null
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
            data: updateStatusPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 500,
      message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
      error: error,
      data: null,
    };
  }
};

const getCourse = async (
  student_id,
  page,
  limit,
  monthFilter,
  yearFilter,
  search
) => {
  try {
    // const { page, limit, search, category_id, instructor_id } = payload;
    const skip = (page - 1) * limit;
    let checkMatch = {};
    let typeMatch = {};
    if (search) {
      checkMatch = {
        course_title: new RegExp(`^${search}`, "i"),
      };
    }

    // if (category_id) checkMatch.category_id = category_id;
    // if (instructor_id) checkMatch.instructor_id = instructor_id;

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

    const pipeline = [
      { $match: { ...checkMatch } }, // search, category_id, instructor_id

      // ── Must be purchased ────────────────────────────────────────
      {
        $lookup: {
          from: "purchases",
          let: { cid: "$course_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course_id", "$$cid"] },
                    { $eq: ["$student_id", student_id] },
                  ],
                },
              },
            },
            { $limit: 1 }, // optimization: we only care if ≥1 exists
          ],
          as: "purchase",
        },
      },
      { $match: { "purchase.0": { $exists: true }, ...timeCheck } }, // only keep purchased

      // ── is_favourite flag ────────────────────────────────────────
      {
        $lookup: {
          from: "favourites",
          let: { cid: "$course_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course_id", "$$cid"] },
                    { $eq: ["$student_id", student_id] },
                    { $ne: ["$course_id", null] }, // your original condition
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "fav",
        },
      },
      {
        $addFields: {
          is_favourite: { $gt: [{ $size: "$fav" }, 0] },
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
          as: "topics",
        },
      },
      {
        $lookup: {
          from: "quizzes",
          let: {
            quizIds: {
              $setUnion: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: { $ifNull: ["$topics", []] },
                        as: "t",
                        cond: { $ne: ["$$t.quiz_id", null] },
                      },
                    },
                    as: "t",
                    in: "$$t.quiz_id",
                  },
                },
              ],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$quiz_id", "$$quizIds"],
                },
              },
            },
            {
              $group: {
                _id: "$quiz_id",
              },
            },
          ],
          as: "quizzes",
        },
      },
      {
        $addFields: {
          quiz_count: {
            $size: {
              $filter: {
                input: "$topics",
                as: "t",
                cond: {
                  $and: [
                    { $eq: ["$$t.topic_type", "quiz"] },
                    { $ne: ["$$t.quiz_id", ""] },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          course_duration: { $sum: "$chapters.chapter_duration" },
          instructor_first_name: {
            $arrayElemAt: ["$instructor.instructor_first_name", 0],
          },
          instructor_last_name: {
            $arrayElemAt: ["$instructor.instructor_last_name", 0],
          },
          category_title: { $arrayElemAt: ["$category.category_title", 0] },
          sub_category_title: {
            $arrayElemAt: ["$subCategory.sub_category_title", 0],
          },

          total_chapters: { $size: { $ifNull: ["$chapters", []] } },
        },
      },
      { $match: { ...typeMatch } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },

      {
        $project: {
          _id: 0,
          course_id: 1,
          category_id: 1,
          sub_category_id: 1,
          instructor_id: 1,
          instructor_first_name: 1,
          instructor_last_name: 1,
          category_title: 1,
          sub_category_title: 1,
          course_title: 1,
          course_thumbnail: 1,
          course_status: 1,
          course_price: { $ifNull: ["$course_price", 0] },
          course_discount: { $ifNull: ["$course_discount", 0] },
          course_tags: { $ifNull: ["$course_tags", []] },
          course_overview: 1,
          student_enrolled: { $ifNull: ["$student_enrolled", 0] },
          course_total_rating: { $ifNull: ["$course_total_rating", 0] },
          course_duration: 1,
          chapter_count: { $ifNull: ["$chapter_count", 0] },
          quiz_count: 1,
          reviewed_by: { $ifNull: ["$reviewed_by", 0] },
          createdAt: 1,
          course_published_date: { $ifNull: ["$course_published_date", ""] },
          updatedAt: 1,
          is_favourite: 1,
          // current_topic_doc: 1,
          // current_topic_id: { $arrayElemAt: ["$current_topic.current_topic_id", 0] },
          current_chapter: {
            $cond: {
              if: { $ifNull: ["$current_chapter", false] },
              then: {
                chapter_id: "$current_chapter.chapter_id",
                chapter_rank: "$current_chapter.chapter_rank",
                chapter_title: "$current_chapter.chapter_title",
                chapter_duration: "$current_chapter.chapter_duration",
                chapter_description: "$current_chapter.chapter_description",
                video_url: "$current_chapter.video_url", // or preview_url, etc.
                current_topic_id: {
                  $arrayElemAt: ["$current_topic.current_topic_id", 0],
                },
                next_topic_id: "$next_topic_doc.topic_id",
                // thumbnail:    "$next_chapter.chapter_thumbnail",
                // is_free:      "$next_chapter.is_free",         // if you have preview chapters
              },
              else: null,
            },
          },
          is_purchased: { $literal: true },
        },
      },
    ];

    const getCoursePayload = await course.aggregate(pipeline).exec();

    const count = getCoursePayload.length;
    const response = getCoursePayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
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

// const addNewCourse = async (course_id, student_id) => {
//   try {
//     const addNewCoursePayload = await purchase.create({
//       purchase_id: randomBytes(6).toString("hex"),
//       student_id: student_id,
//       course_id: course_id,
//       transaction_id: "FR" + randomBytes(6).toString("hex"),
//       payment_method: "Free",
//       course_amount: 0,
//       if_free: true,
//     });

//     await course.updateOne(
//       { course_id: course_id },
//       {
//         $inc: {
//           student_enrolled: 1,
//         },
//       }
//     );

//     // await revenueModel.updateOne(
//     //   { instructor_id: instructor_id, revenue_month: month },
//     //   {
//     //     $inc: {
//     //       total_sales: 1,
//     //       total_amount: parseInt(amount),
//     //     },
//     //   }
//     // );

//     const chapters = await chapter
//       .find({ course_id }, { chapter_id: 1, chapter_rank: 1 })
//       .sort({ chapter_rank: 1 })
//       .lean();

//     const topics = await topic
//       .find({ course_id }, { topic_id: 1, chapter_id: 1, topic_rank: 1 })
//       .sort({ topic_rank: 1 })
//       .lean();

//     const topicMap = {};

//     topics.forEach((t) => {
//       if (!topicMap[t.chapter_id]) {
//         topicMap[t.chapter_id] = [];
//       }
//       topicMap[t.chapter_id].push(t);
//     });

//     const payload = chapters.map((ch, index) => {
//       const chapterTopics = topicMap[ch.chapter_id] || [];
//       const firstTopic = chapterTopics.length > 0 ? chapterTopics[0] : null;

//       const isFirstChapter = index == 0;
//       return {
//         completion_id: randomBytes(6).toString("hex"),
//         course_id,
//         student_id,

//         chapter_id: ch.chapter_id,
//         current_chapter_id: ch.chapter_id,
//         chapter_rank: ch.chapter_rank,
//         course_status: "new",
//         // ✅ Only first chapter is active
//         chapter_status: isFirstChapter ? "inprogress" : "new",
//         // // ✅ ONLY first chapter gets topic
//         // current_topic_id: isFirstChapter ? firstTopic?.topic_id : null,
//         current_topic_id: firstTopic?.topic_id || null,
//         topic_array: [],
//       };
//     });
//     await courseCompletionModel.insertMany(payload);
//     return {
//       status: 201,
//       message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
//       data: addNewCoursePayload,
//     };
//   } catch (error) {
//     return {
//       status: 412,
//       message: error.message,
//       data: [],
//     };
//   }
// };

const addNewCourse = async (course_ids, student_id) => {
  try {
    // ✅ 1. Create purchases in bulk
    const purchasePayload = course_ids.map((course_id) => ({
      purchase_id: randomBytes(6).toString("hex"),
      student_id,
      course_id,
      transaction_id: "FR" + randomBytes(6).toString("hex"),
      payment_method: "Free",
      course_amount: 0,
      if_free: true,
    }));

    await purchase.insertMany(purchasePayload);

    // ✅ 2. Update all courses at once
    await course.updateMany(
      { course_id: { $in: course_ids } },
      { $inc: { student_enrolled: 1 } }
    );

    // ✅ 3. Fetch all chapters + topics once
    const chapters = await chapter
      .find({ course_id: { $in: course_ids } })
      .lean();

    const topics = await topic.find({ course_id: { $in: course_ids } }).lean();

    // ✅ 4. Group topics by course + chapter
    const topicMap = {};
    topics.forEach((t) => {
      if (!topicMap[t.course_id]) topicMap[t.course_id] = {};
      if (!topicMap[t.course_id][t.chapter_id]) {
        topicMap[t.course_id][t.chapter_id] = [];
      }
      topicMap[t.course_id][t.chapter_id].push(t);
    });

    // ✅ 5. Prepare completion payload
    let completionPayload = [];

    course_ids.forEach((course_id) => {
      const courseChapters = chapters
        .filter((ch) => ch.course_id === course_id)
        .sort((a, b) => a.chapter_rank - b.chapter_rank);

      courseChapters.forEach((ch, index) => {
        const chapterTopics = topicMap?.[course_id]?.[ch.chapter_id] || [];

        const firstTopic = chapterTopics.length > 0 ? chapterTopics[0] : null;

        const isFirstChapter = index === 0;

        completionPayload.push({
          completion_id: randomBytes(6).toString("hex"),
          course_id,
          student_id,
          chapter_id: ch.chapter_id,
          current_chapter_id: ch.chapter_id,
          chapter_rank: ch.chapter_rank,
          course_status: "new",
          chapter_status: isFirstChapter ? "inprogress" : "new",
          current_topic_id: firstTopic?.topic_id || null,
          topic_array: [],
        });
      });
    });

    // ✅ 6. Insert all completions
    await courseCompletionModel.insertMany(completionPayload);

    return {
      status: 201,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: purchasePayload,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const getCertificate = async (
  student_id,
  page,
  limit,
  monthFilter,
  yearFilter
) => {
  try {
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
    const getCertificatePayload = await certificate.aggregate([
      {
        $match: {
          ...timeCheck,
          student_id: student_id,
        },
      },
      // {
      //   $lookup: {
      //     from: "students",
      //     localField: "student_id",
      //     foreignField: "student_id",
      //     as: "student",
      //   },
      // },
      {
        $lookup: {
          from: "courses",
          localField: "course_id",
          foreignField: "course_id",
          as: "course",
        },
      },
      {
        $lookup: {
          from: "topics",
          localField: "course_id",
          foreignField: "course_id",
          as: "topics",
        },
      },
      {
        $lookup: {
          from: "submissions",
          let: {
            courseId: "$course_id",
            studentId: "$student_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course_id", "$$courseId"] },
                    { $eq: ["$student_id", "$$studentId"] },
                  ],
                },
              },
            },

            // latest attempt per quiz
            {
              $sort: { quiz_id: 1, quiz_attempt: -1 },
            },
            {
              $group: {
                _id: "$quiz_id",
                total_score: { $first: "$total_score" },
                quiz_total_points: { $first: "$quiz_total_points" },
              },
            },

            // sum all quizzes
            {
              $group: {
                _id: null,
                total_score: { $sum: "$total_score" },
                total_points: { $sum: "$quiz_total_points" },
              },
            },
          ],
          as: "student_score",
        },
      },
      {
        $addFields: {
          avg_score: {
            $cond: [
              {
                $eq: [
                  {
                    $ifNull: [
                      { $arrayElemAt: ["$student_score.total_points", 0] },
                      0,
                    ],
                  },
                  0,
                ],
              },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $arrayElemAt: ["$student_score.total_score", 0] },
                          { $arrayElemAt: ["$student_score.total_points", 0] },
                        ],
                      },
                      10,
                    ],
                  },
                  2,
                ],
              },
            ],
          },
          avg_total_marks: {
            $cond: [
              { $eq: [{ $size: "$topics" }, 0] },
              0,
              {
                $round: [
                  {
                    $divide: [
                      { $arrayElemAt: ["$student_score.total_points", 0] },
                      {
                        $size: {
                          $filter: {
                            input: { $ifNull: ["$topics", []] },
                            as: "t",
                            cond: {
                              $and: [
                                { $ne: ["$$t.quiz_id", null] },
                                { $ne: ["$$t.quiz_id", ""] },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                  2,
                ],
              },
            ],
          },
        },
      },
      { $sort: { issue_date: -1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          certificate_id: 1,
          student_id: 1,
          // student_firstname: {
          //   $arrayElemAt: ["$student.student_first_name", 0],
          // },
          // student_lastname: {
          //   $arrayElemAt: ["$student.student_last_name", 0],
          // },
          // student_avatar: {
          //   $arrayElemAt: ["$student.student_avatar", 0],
          // },
          // student_skills: {
          //   $ifNull: [
          //     {
          //       $arrayElemAt: ["$student.student_skills", 0],
          //     },
          //     [],
          //   ],
          // },
          course_id: 1,
          course_title: {
            $arrayElemAt: ["$course.course_title", 0],
          },
          course_thumbnail: {
            $arrayElemAt: ["$course.course_thumbnail", 0],
          },
          course_description: {
            $arrayElemAt: ["$course.course_description", 0],
          },
          total_videos: {
            $size: {
              $filter: {
                input: {
                  $ifNull: ["$topics", []],
                },
                as: "t",
                cond: {
                  $and: [
                    { $ne: ["$$t.video_url", null] },
                    { $ne: ["$$t.video_url", ""] },
                  ],
                },
              },
            },
          },
          total_quiz: {
            $size: {
              $filter: {
                input: {
                  $ifNull: ["$topics", []],
                },
                as: "t",
                cond: {
                  $and: [
                    { $ne: ["$$t.quiz_id", null] },
                    { $ne: ["$$t.quiz_id", ""] },
                  ],
                },
              },
            },
          },
          total_score: {
            $ifNull: [{ $arrayElemAt: ["$student_score.total_score", 0] }, 0],
          },
          total_points: {
            $ifNull: [{ $arrayElemAt: ["$student_score.total_points", 0] }, 0],
          },
          avg_score: { $ifNull: ["$avg_score", 0] },
          avg_total_marks: { $ifNull: ["$avg_total_marks", 0] },
          certificate_url: 1,
          createdAt: "$issued_date",
        },
      },
    ]);

    const count = await certificate.countDocuments({
      ...timeCheck,
      student_id: student_id,
    });
    return getCertificatePayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getCertificatePayload,
        }
      : {
          status: 409,
          message: CONSTANT.STATUS.NOT_FOUND,
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

const addNewCertificate = async (course_ids, student_id) => {
  try {
    const certificatePayload = course_ids.map((course_id) => ({
      certificate_id: randomBytes(6).toString("hex"),
      student_id,
      course_id,
      certificate_url:
        "https://www.rd.usda.gov/sites/default/files/pdf-sample_0.pdf",
      certicate_type: null,
      quiz_badge_id: null,
      course_badge_id: null,
      is_free: true,
      issued_date: new Date(),
    }));

    const result = await certificateModel.insertMany(certificatePayload);

    return {
      status: 201,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: result,
    };
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const getMonthlyStats = async (monthFilter, yearFilter) => {
  try {
    const MONTH_NAMES = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    const currentYear = yearFilter
      ? Number(yearFilter)
      : new Date().getFullYear();

    let matchFilter = {
      createdAt: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
      },
    };

    let monthIndex = null;

    if (monthFilter) {
      monthIndex = MONTH_NAMES.indexOf(monthFilter.toLowerCase());

      if (monthIndex === -1) {
        return { status: 409, message: "Invalid month name", data: [] };
      }

      const start = new Date(currentYear, monthIndex, 1);
      const end = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59, 999); // ✅ FIX

      matchFilter.createdAt = { $gte: start, $lte: end };
    }

    const result = await student.aggregate([
      {
        $facet: {
          // ✅ ALL MONTH DATA (NO month filter)
          monthly: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                  $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
                },
              },
            },
            {
              $group: {
                _id: { $month: "$createdAt" },
                total_student: { $sum: 1 },
              },
            },
          ],

          // ✅ FILTERED DATA (month/year)
          filtered: [
            { $match: matchFilter },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
              },
            },
          ],

          active: [
            { $match: { student_status: "active" } },
            { $count: "count" },
          ],

          suspended: [
            { $match: { student_status: "suspended" } },
            { $count: "count" },
          ],
        },
      },
    ]);

    // DEFAULT MONTH STRUCTURE
    const monthlyData = {};
    MONTH_NAMES.forEach((m) => {
      monthlyData[m] = { total_student: 0 };
    });

    // MAP DATA
    result[0].monthly.forEach((item) => {
      const monthName = MONTH_NAMES[item._id - 1];
      monthlyData[monthName].total_student = item.total_student;
    });

    // ✅ FIXED HERE
    const finalData = monthlyData; // ✅ ALWAYS ALL MONTHS

    const totalstudent = await student.countDocuments();

    return {
      status: 200,
      message: "Student monthly stats fetched successfully",
      year: currentYear,
      totalstudent,
      total_active_student: result[0].active[0]?.count || 0,
      total_suspended_student: result[0].suspended[0]?.count || 0,
      data: finalData,
    };
  } catch (error) {
    return {
      status: 500,
      message: error.message,
      data: [],
    };
  }
};

const forgetPassword = async (email, phone_no) => {
  try {
    // const { email, phone_no } = payload;
    // const otp = randomInt(1000, 9999);
    let checkMatch = {};

    if (email) checkMatch.student_email = email;
    if (phone_no) checkMatch.student_phone_no = phone_no;

    const studentPayload = await student.findOne(
      {
        ...checkMatch,
      },
      { student_email: 1, student_name: 1, student_auth_token: 1 }
    );

    if (!studentPayload) {
      return { status: 409, message: CONSTANT.STATUS.NOT_FOUND, data: [] };
    }

    const otpResponse = await sendVerificationEmail(
      studentPayload?.student_name,
      studentPayload?.student_email,
      studentPayload?.student_auth_token
    );

    return otpResponse;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const verifyOtp = async (email, otp) => {
  try {
    // const { email, otp } = payload;
    let verifyOtpPayload = null;
    const savedOtp = await student.findOne(
      { student_email: email },
      { student_otp: 1 }
    );

    if (Number(otp) === savedOtp.student_otp) {
      verifyOtpPayload = await student
        .findOneAndUpdate({ student_email: email }, { student_otp: null })
        .lean();
    }

    const response =
      verifyOtpPayload !== null
        ? {
            status: 200,
            message: CONSTANT.COGNITO.OTP_CONFIRMED,
            data: email,
          }
        : {
            status: 409,
            message: CONSTANT.COGNITO.OTP_NOT_CONFIRMED,
            data: [],
          };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const changePassword = async (email, password) => {
  try {
    // const { email, password } = payload;
    const studentPayload = await student.findOne({ student_email: email });

    if (!studentPayload) {
      return { status: 409, message: CONSTANT.STATUS.NOT_FOUND, data: [] };
    }

    let saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);

    const changePasswordPayload = await student.findOneAndUpdate(
      { student_email: email },
      { student_password: hashPassword }
    );

    const response =
      changePasswordPayload !== null
        ? {
            status: 200,
            message: CONSTANT.student.PASSWORD_CHANGED,
            data: [],
          }
        : { status: 409, message: CONSTANT.PASSWORD.UNCONFIRMED, data: [] };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const purchaseCourse = async (
  student_id,
  course_id,
  transaction_id,
  method,
  amount
) => {
  try {
    // const { course_id, transaction_id, method, amount } = payload;
    const purchaseCoursePayload = await purchase.create({
      purchase_id: randomBytes(6).toString("hex"),
      student_id: student_id,
      course_id: course_id,
      transaction_id: transaction_id,
      payment_method: method,
      course_amount: amount,
    });

    await course.updateOne(
      { course_id: course_id },
      {
        $inc: {
          student_enrolled: 1,
        },
      }
    );

    await courseCompletionModel.create({
      completion_id: randomBytes(6).toString("hex"),
      course_id: course_id,
      student_id: student_id,
      course_status: "new",
    });

    const response =
      purchaseCoursePayload !== null
        ? {
            status: 200,
            message: CONSTANT.USER.COURSE_PURCHASED,
            data: purchaseCoursePayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const studentActivity = async (student_id, page, limit) => {
  try {
    const skip = (page - 1) * limit;
    const purchaseData = await purchase.aggregate([
      {
        $match: { student_id: student_id },
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
        $project: {
          _id: 0,
          course_id: 1,
          purchase_id: 1,
          student_id: 1,
          course_title: { $arrayElemAt: ["$courses.course_title", 0] },
          createdAt: 1,
          // type: "purchase"
        },
      },
    ]);

    const completionData = await course.aggregate([
      {
        $lookup: {
          from: "course_completions",
          let: { courseId: "$course_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course_id", "$$courseId"] },
                    { $eq: ["$student_id", student_id] },
                    { $eq: ["$course_status", "completed"] },
                  ],
                },
              },
            },
          ],
          as: "completions",
        },
      },
      {
        $match: {
          $expr: {
            $gt: [{ $size: "$completions" }, 0], // only keep documents where completion exists
          },
        },
      },
      {
        $unwind: "$completions", // optional – removes the array
      },
      {
        $project: {
          course_id: "$course_id",
          course_title: 1,
          student_id: "$completions.student_id",
          completion_id: "$completions.completion_id",
          completedAt: "$completions.createdAt",
        },
      },
      {
        $sort: { completedAt: -1 },
      },
    ]);

    let activityPayload = [...purchaseData, ...completionData];

    const response =
      activityPayload !== null
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
            data: activityPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const studentPurchases = async (student_id, page, limit) => {
  try {
    const skip = (page - 1) * limit;
    const purchaseDataPayload = await purchase.aggregate([
      {
        $match: { student_id: student_id },
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
          from: "categories",
          localField: "courses.category_id",
          foreignField: "category_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "sub_categories",
          localField: "courses.sub_category_id",
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
          purchase_id: 1,
          student_id: 1,
          payment_method: 1,
          course: {
            course_title: { $arrayElemAt: ["$courses.course_title", 0] },
            course_thumbnail: {
              $arrayElemAt: ["$courses.course_thumbnail", 0],
            },
            course_overview: { $arrayElemAt: ["$courses.course_overview", 0] },
            category_title: { $arrayElemAt: ["$category.category_title", 0] },
            sub_category_title: {
              $arrayElemAt: ["$sub_category.sub_category_title", 0],
            },
          },
          course_amount: { $arrayElemAt: ["$courses.course_price", 0] },
          course_discount: { $arrayElemAt: ["$courses.course_discount", 0] },
          createdAt: 1,
          // type: "purchase"
        },
      },
    ]);

    const response =
      purchaseDataPayload !== null
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
            data: purchaseDataPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

module.exports = {
  signUp,
  login,
  getStudentList,
  updateStatus,
  getCourse,
  addNewCourse,
  getCertificate,
  addNewCertificate,
  getMonthlyStats,
  forgetPassword,
  verifyOtp,
  changePassword,
  purchaseCourse,
  studentActivity,
  studentPurchases,
};
