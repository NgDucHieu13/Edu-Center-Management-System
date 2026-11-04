const express = require('express');
const controller = require('../controllers/management.controller');
const router = express.Router();
// Development only: management endpoints are open for local UI testing.

router.get('/courses', controller.listCourses);
router.get('/courses/:id', controller.getCourse);
router.post('/courses', controller.createCourse);
router.patch('/courses/:id', controller.updateCourse);
router.delete('/courses/:id', controller.deleteCourse);

router.get('/classes', controller.listClasses);
router.get('/classes/:id', controller.getClass);
router.post('/classes', controller.createClass);
router.patch('/classes/:id', controller.updateClass);

router.get('/teachers', controller.listTeachers);
router.get('/teachers/:id', controller.getTeacher);
router.post('/teachers', controller.createTeacher);
router.patch('/teachers/:id', controller.updateTeacher);
router.delete('/teachers/:id', controller.deleteTeacher);
router.get('/teachers/:id/classes', (req, res, next) => {
  req.query.ma_giao_vien = req.params.id;
  return controller.listClasses(req, res, next);
});

router.get('/waitlist', controller.listWaitlist);
router.delete('/waitlist/:id', controller.cancelWaitlist);
router.get('/registrations', controller.listRegistrations);
router.post('/registrations', controller.registerStudent);
router.post('/registrations/:id/adjustments', controller.requestAdjustment);
router.post('/adjustments/:id/approve', controller.approveAdjustment);

module.exports = router;
