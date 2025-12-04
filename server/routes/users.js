const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

// CREATE - 새 유저 생성 (회원가입)
router.post('/', createUser);

// READ - 모든 유저 조회
router.get('/', getAllUsers);

// READ - 특정 유저 조회
router.get('/:id', getUserById);

// UPDATE - 유저 정보 수정
router.put('/:id', updateUser);

// DELETE - 유저 삭제
router.delete('/:id', deleteUser);

module.exports = router;

