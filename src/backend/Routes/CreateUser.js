const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");    
const { body, validationResult } = require("express-validator");
