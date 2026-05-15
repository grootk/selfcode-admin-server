const categoryService = require("./category.service");
const { successHandler, errorHandler } = require("../../packages/handlers");

const getCategory = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query;
    const data = await categoryService.getCategory(
      page, limit, search, status
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

const addCategory = async (req, res, next) => {
  try {
    const { title, icon } = req.body;
    const data = await categoryService.addCategory(
      title, icon
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

const updateCategory = async (req, res, next) => {
  try {
    const { category_id,
      title,
      icon,
      status } = req.body;
    const data = await categoryService.updateCategory(
      category_id,
      title,
      icon,
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

const deleteCategory = async (req, res, next) => {
  try {
    const { category_id } = req.query;
    const data = await categoryService.deleteCategory(category_id);
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

const getSubCategory = async (req, res, next) => {
  try {
    const { page, limit, search, status, category_id } = req.query;
    const data = await categoryService.getSubCategory(
      page, limit, search, status, category_id
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

const addSubCategory = async (req, res, next) => {
  try {
    const { category_id, title, icon } = req.body;
    const data = await categoryService.addSubCategory(
      category_id, title, icon
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

const updateSubCategory = async (req, res, next) => {
  try {
    const { sub_category_id,
      title,
      icon,
      status } = req.body;
    const data = await categoryService.updateSubCategory(
      sub_category_id,
      title,
      icon,
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

const deleteSubCategory = async (req, res, next) => {
  try {
    const {sub_category_id} = req.query;
    const data = await categoryService.deleteSubCategory(sub_category_id);
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
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
  getSubCategory,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
};
