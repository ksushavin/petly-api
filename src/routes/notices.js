const express = require('express');
const router = new express.Router();
const authHeaderValidation = require('../middlewares/authHeaderValidation');

const upload = require('../middlewares/upload');
const noticeIdParameterValidation = require('../middlewares/idRequestParameterValidation/noticeIdParameterValidation');
const noticeCategoryParameterValidation = require('../middlewares/noticeCategoryParameterValidation/validation');
const noticeBodyValidation = require('../middlewares/noticeBodyValidation/validation');

const {
  getNoticeCategoryController,
  getUserOwnNoticesController,
  getUserFavoriteNoticesController,
  getNoticeById,
  addNoticeController,
  deleteNoticeByIdAndOwnerController,
} = require('../controllers/notices');

router.get('/own', authHeaderValidation, getUserOwnNoticesController);
router.get('/favorite', authHeaderValidation, getUserFavoriteNoticesController);
router.get(
  '/category/:categoryName',
  noticeCategoryParameterValidation,
  getNoticeCategoryController
);
router.get('/:noticeId', noticeIdParameterValidation, getNoticeById);
router.post(
  '/',
  authHeaderValidation,
  upload.single('notice_avatar'),
  noticeBodyValidation,
  addNoticeController
);
router.delete(
  '/:noticeId',
  authHeaderValidation,
  noticeIdParameterValidation,
  deleteNoticeByIdAndOwnerController
);

module.exports = router;
