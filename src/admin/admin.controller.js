const adminService = require("./admin.service");
const { successHandler, errorHandler } = require("../../packages/handlers");

const getProfile = async (req, res, next) => {
  try {
    const admin_id = req.data.sub;
    const data = await adminService.getProfile(admin_id);
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

const addadmin = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const {
      title,
      type,
      discount,
      code,
      is_promotional,
      category_id,
      start_date,
      end_date,
    } = req.body;
    const data = await adminService.addadmin(
      instructor_id,
      title,
      type,
      discount,
      code,
      is_promotional,
      category_id,
      start_date,
      end_date
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

const updateadmin = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const {
      admin_id,
      title,
      type,
      discount,
      is_promotional,
      category_id,
      start_date,
      end_date,
    } = req.body;
    const data = await adminService.updateadmin(
      admin_id,
      title,
      type,
      discount,
      is_promotional,
      category_id,
      start_date,
      end_date
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

const deleteadmin = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { admin_id, force_delete } = req.query;
    const data = await adminService.deleteadmin(
      admin_id,
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
  getProfile,
  addadmin,
  updateadmin,
  deleteadmin,
};
