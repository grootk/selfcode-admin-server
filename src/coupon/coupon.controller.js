const couponService = require("./coupon.service");
const { successHandler, errorHandler } = require("../../packages/handlers");

const getcoupon = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { page, limit } = req.query;
    const data = await couponService.getcoupon(instructor_id, page, limit);
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

const addcoupon = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { title, type, discount, code } = req.body;
    const data = await couponService.addcoupon(
      instructor_id,
      title,
      type,
      discount,
      code
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

const updatecoupon = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { coupon_id, title, type, discount, code } = req.body;
    const data = await couponService.updatecoupon(
      coupon_id,
      title,
      type,
      discount,
      code
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

const deletecoupon = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { coupon_id, force_delete } = req.query;
    const data = await couponService.deletecoupon(
      coupon_id,
      instructor_id,
      force_delete
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

module.exports = {
  getcoupon,
  addcoupon,
  updatecoupon,
  deletecoupon,
};
