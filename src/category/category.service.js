const { randomBytes } = require("crypto");
const { CONSTANT, mongoManager } = require("../../packages/manager");
const category = require("../model/category.model");
const subCategory = require("../model/subCategory.model");
mongoManager.connect();

const getCategory = async (page, limit, search, status) => {
    try {
        // const { page, limit, search, status } = payload;
        const skip = (page - 1) * limit;
        let checkMatch = {};
        if (search) {
            checkMatch = {
                category_name: new RegExp(`^${search}`, "i"),
            };
        }

        if (status) checkMatch.category_status = status;

        const getCategoryPayload = await category.aggregate([
            { $match: checkMatch },
            {
                $project: {
                    _id: 0,
                    category_id: 1,
                    category_title: { $ifNull: ["$category_title", ""] },
                    category_icon: { $ifNull: ["$category_icon", ""] },
                    category_status: { $ifNull: ["$category_status", "Active"] },
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $skip: Number(skip) },
            { $limit: Number(limit) },
        ]);
        const count = await category.countDocuments({ ...checkMatch });
        const response = getCategoryPayload.length
            ? {
                status: 200,
                message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
                count: count,
                data: getCategoryPayload,
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

const addCategory = async (
    title, icon
) => {
    try {
        // const { title, icon } = payload
        const addCategoryPayload = await category.create({
            category_id: randomBytes(6).toString("hex"),
            category_title: title,
            category_icon: icon
        });
        const response =
            addCategoryPayload !== null
                ? {
                    status: 201,
                    message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
                    data: addCategoryPayload,
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

const updateCategory = async (
    category_id,
    title,
    icon,
    status
) => {
    try {
        // const { category_id,
        //     title,
        //     icon,
        //     status } = payload
        const updateCategoryPayload = await category.findOneAndUpdate(
            { category_id: category_id },
            {
                category_title: title,
                category_icon: icon,
                category_status: status
            }, { new: true }
        );
        const response =
            updateCategoryPayload !== null
                ? {
                    status: 202,
                    message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
                    data: updateCategoryPayload,
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

const deleteCategory = async (category_id) => {
    try {
        // const {category_id}=payload;
        const deleteCategoryPayload = await category.findOneAndDelete({
            category_id: category_id,
        });

        const response =
            deleteCategoryPayload !== null
                ? {
                    status: 202,
                    message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
                    data: deleteCategoryPayload,
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

const getSubCategory = async (page, limit, search, status, category_id) => {
    try {
        // const { page, limit, search, status,category_id } = payload;
        const skip = (page - 1) * limit;
        let checkMatch = {};
        if (search) {
            checkMatch = {
                sub_category_name: new RegExp(`^${search}`, "i"),
            };
        }

        if (status) checkMatch.sub_category_status = status;
        if (category_id) checkMatch.category_id = category_id;

        const getSubCategoryPayload = await subCategory.aggregate([
            { $match: { ...checkMatch } },
            {
                $project: {
                    _id: 0,
                    sub_category_id: 1,
                    sub_category_title: { $ifNull: ["$sub_category_title", ""] },
                    sub_category_icon: { $ifNull: ["$sub_category_icon", ""] },
                    sub_category_status: { $ifNull: ["$sub_category_status", "Active"] },
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $skip: Number(skip) },
            { $limit: Number(limit) },
        ]);
        const count = await subCategory.countDocuments({ ...checkMatch });
        const response = getSubCategoryPayload.length
            ? {
                status: 200,
                message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
                count: count,
                data: getSubCategoryPayload,
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

const addSubCategory = async (
    category_id, title, icon
) => {
    try {
        // const { category_id,title, icon } = payload
        const addSubCategoryPayload = await subCategory.create({
            sub_category_id: randomBytes(6).toString("hex"),
            category_id: category_id,
            sub_category_title: title,
            sub_category_icon: icon
        });
        const response =
            addSubCategoryPayload !== null
                ? {
                    status: 201,
                    message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
                    data: addSubCategoryPayload,
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

const updateSubCategory = async (
    sub_category_id,
    title,
    icon,
    status
) => {
    try {
        // const { sub_category_id,
        //     title,
        //     icon,
        //     status } = payload
        const updateSubCategoryPayload = await subCategory.findOneAndUpdate(
            { sub_category_id: sub_category_id },
            {
                sub_category_title: title,
                sub_category_icon: icon,
                sub_category_status: status
            }, { new: true }
        );
        const response =
            updateSubCategoryPayload !== null
                ? {
                    status: 202,
                    message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
                    data: updateSubCategoryPayload,
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

const deleteSubCategory = async (sub_category_id) => {
    try {
        // const {sub_category_id}=payload;
        const deleteSubCategoryPayload = await subCategory.findOneAndDelete({
            sub_category_id: sub_category_id,
        });

        const response =
            deleteSubCategoryPayload !== null
                ? {
                    status: 202,
                    message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
                    data: deleteSubCategoryPayload,
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
