const { randomBytes } = require("crypto");
const { CONSTANT, mongoManager } = require("../../packages/manager");
const coupon = require("../model/coupon.model");
const chapter = require("../model/chapter.model");
const instructor = require("../model/instructor.model");
const topic = require("../model/topic.model");
const favouriteModel = require("../model/favourite.model");
const topicModel = require("../model/topic.model");
const student = require("../model/student.model");
const chapterModel = require("../model/chapter.model");
const couponModel = require("../model/coupon.model");
const activity = require("../model/activity.model");
const courseModel = require("../model/course.model");
mongoManager.connect();

const getcoupon = async (instructor_id, page, limit) => {
  try {
    const skip = (page - 1) * limit;
    const getCouponPayload = await couponModel
      .find({ instructor_id: instructor_id })
      .skip(skip)
      .limit(limit);
    const count = await couponModel.countDocuments({
      instructor_id: instructor_id,
    });
    const response = getCouponPayload
      ? {
        status: 200,
        count: count,
        message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
        data: getCouponPayload,
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

// const addcoupon = async (instructor_id, coupon) => {
//   try {
//     // Get all existing coupon codes
//     const existingCoupons = await couponModel.find(
//       { coupon_code: { $in: coupon.map((c) => c.code) } },
//       { coupon_code: 1 }
//     );
//     const existingCodes = new Set(existingCoupons.map((c) => c.coupon_code));

//     let couponsData = [];
//     let duplicates = [];

//     for (const item of coupon) {
//       if (existingCodes.has(item.code)) {
//         duplicates.push({
//           code: item.code,
//           reason: "Coupon code already exists",
//         });
//       } else {
//         let coupon_id = randomBytes(6).toString("hex");
//         let couponItem = {
//           coupon_id: coupon_id,
//           instructor_id: instructor_id,
//           coupon_title: item.title,
//           coupon_type: item.type,
//           coupon_code: item.code,
//           coupon_discount: item.discount,
//         };
//         couponsData.push(couponItem);
//       }
//     }

//     // Insert only valid coupons
//     let addcouponPayload = [];
//     if (couponsData.length > 0) {
//       addcouponPayload = await couponModel.insertMany(couponsData);
//     }

//     const response = {
//       status: couponsData.length > 0 ? 201 : 409,
//       message:
//         couponsData.length > 0
//           ? CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY
//           : "No valid coupons to create",
//       data: addcouponPayload,
//       ...(duplicates.length > 0 && { duplicates: duplicates }),
//     };
//     return response;
//   } catch (error) {
//     return {
//       status: 412,
//       message: error.message,
//       data: [],
//     };
//   }
// };

const addcoupon = async (instructor_id, title, type, discount, code) => {
  try {
    const coupon_id = randomBytes(6).toString("hex");
    const couponItem = {
      coupon_id: coupon_id,
      instructor_id: instructor_id,
      coupon_title: title,
      coupon_type: type,
      coupon_code: code,
      coupon_discount: discount,
    };

    const addcouponPayload = await couponModel.create(couponItem);

    const response = {
      status: 201,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: addcouponPayload,
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

const updatecoupon = async (coupon_id, title, type, discount, code) => {
  try {
    const updatecouponPayload = await coupon.findOneAndUpdate(
      { coupon_id: coupon_id },
      {
        coupon_title: title,
        coupon_type: type,
        coupon_code: code,
        coupon_discount: discount,
      }
    );
    const response =
      updatecouponPayload !== null
        ? {
          status: 202,
          message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
          data: updatecouponPayload,
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

const deletecoupon = async (coupon_id, instructor_id, force_delete) => {
  try {
    let deletecouponPayload;
    const couponData = await coupon.findOne({ coupon_id: coupon_id }, { _id: 0, coupon_code: 1 });
    const attachedCoupons = await courseModel.find({ course_coupons: { $in: couponData?.coupon_code } });

    if (force_delete == "true") {

      await courseModel.updateMany(
        { course_coupons: { $in: couponData?.coupon_code }},
        { $pull: { course_coupons: couponData?.coupon_code } }
      );
      const deletecouponPayload = await couponModel.findOneAndDelete({
        coupon_id: coupon_id,
      });
      const response =
        deletecouponPayload !== null
          ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
            data: deletecouponPayload,
          }
          : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
      return response;
    }

    if (attachedCoupons) {
      return {
        status: 409,
        message: `The coupon ${couponData?.coupon_code} is assigned to course ${attachedCoupons[0]?.course_title}.Please detach before delete.`,
        data: []
      }
    }


  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

module.exports = {
  getcoupon,
  addcoupon,
  updatecoupon,
  deletecoupon,
};
