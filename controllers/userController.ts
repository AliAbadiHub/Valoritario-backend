import { Request, Response, Router } from 'express';
import { CustomRequest } from '../types';
import { PrismaClient } from '@prisma/client';
import { authGuard } from '../auth/auth.guard';
import argon2 from 'argon2';


const prisma = new PrismaClient();
const router = Router();


/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created user
 *       500:
 *         description: An error occurred while creating the user
 */
router.post("/", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Hash the password using Argon2
      const hashedPassword = await argon2.hash(password);
      
      // Store the hashed password in the database
      const user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
        },
      });
  
      const userResponse ={
        id: user.userId,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
      };
      
      res.json(userResponse)
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred. Make sure the email is not already registered!" });
    }
  });

/**
 * @swagger
 * /users/{email}/profile:
 *   post:
 *     summary: Add a profile for an existing user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         required: true
 *         description: Email of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address1:
 *                 type: string
 *               city1:
 *                 type: string
 *               address2:
 *                 type: string
 *               city2:
 *                 type: string
 *               address3:
 *                 type: string
 *               city3:
 *                 type: string
 *               address4:
 *                 type: string
 *               city4:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Successfully added user profile
 *       404:
 *         description: User not found
 *       500:
 *         description: An error occurred while adding the user profile
 */
  router.use(authGuard);
  router.post("/:email/profile", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const {
        firstName,
        lastName,
        phone,
        address1,
        city1,
        address2,
        city2,
        address3,
        city3,
        address4,
        city4,
        dob,
      } = req.body;
  
      const existingUser = await prisma.user.findUnique({ where: { email } });
  
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
  
      const birthday = new Date(dob);
      const age = calculateAge(birthday);
  
      const userProfile = await prisma.userProfile.create({
        data: {
          firstName,
          lastName,
          phone,
          address1,
          city1,
          address2,
          city2,
          address3,
          city3,
          address4,
          city4,
          dob: birthday,
          age,
          userId: existingUser.userId,
        },
      });
  
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: "VERIFIED", userProfile: { connect: { profileId: userProfile.profileId } } },
      });
  
      const responseUserProfile = {
        ...userProfile,
        role: updatedUser.role,
        email: updatedUser.email,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      };
  
      const filteredResponseUserProfile = Object.fromEntries(
        Object.entries(responseUserProfile).filter(([key, value]) => value !== null)
      );
  
      res.json(filteredResponseUserProfile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred. Make sure the user exists!" });
    }
  });
  
  function calculateAge(birthday: Date): number {
    const today = new Date();
    const age = today.getFullYear() - birthday.getFullYear();
    const monthDifference = today.getMonth() - birthday.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthday.getDate())) {
      return age - 1;
    }
    return age;
  }

  
  /**
 * @swagger
 * /users/{email}/profile:
 *   patch:
 *     summary: Update the profile for an existing user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         required: true
 *         description: Email of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address1:
 *                 type: string
 *               city1:
 *                 type: string
 *               address2:
 *                 type: string
 *               city2:
 *                 type: string
 *               address3:
 *                 type: string
 *               city3:
 *                 type: string
 *               address4:
 *                 type: string
 *               city4:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Successfully updated user profile
 *       404:
 *         description: User or UserProfile not found
 *       500:
 *         description: An error occurred while updating the user profile
 */
  router.patch("/:email/profile", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const {
        firstName,
        lastName,
        phone,
        address1,
        city1,
        address2,
        city2,
        address3,
        city3,
        address4,
        city4,
        dob,
      } = req.body;
  
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { userProfile: true },
      });
  
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
  
      if (!existingUser.userProfile) {
        return res.status(404).json({ error: "UserProfile not found" });
      }
  
      const updateData: any = {
        firstName,
        lastName,
        phone,
        address1,
        city1,
        address2,
        city2,
        address3,
        city3,
        address4,
        city4,
        dob,
      };
  
      if (dob) {
        const birthday = new Date(dob);
        const age = calculateAge(birthday);
        updateData.dob = birthday;
        updateData.age = age;
      }
  
      const updatedProfile = await prisma.userProfile.update({
        where: { profileId: existingUser.userProfile.profileId },
        data: removeNullFields(updateData),
      });
  
      res.json(updatedProfile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while updating the UserProfile." });
    }
  });


 /**
 * @swagger
 * /users:
 *   get:
 *     summary: Get a list of all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */ 

  router.get("/", async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        userProfile: true,
      },
    });
    res.json(users);
  });
  
  const removeNullFields = (obj: any) => {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null));
  };

 /**
 * @swagger
 * /users/{email}:
 *   get:
 *     summary: Get a user by email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         required: true
 *         description: Email of the user
 *     responses:
 *       200:
 *         description: Successfully retrieved user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */ 
  router.get("/:email", async (req: Request, res: Response) => {
    const { email } = req.params;
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userId: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        userProfile: true,
      },
    });
  
    if (!user) {
      return res.status(404).json({ message: "There is no user with that email address!" });
    }
  
    const userProfile = user.userProfile
      ? removeNullFields(user.userProfile)
      : null;
  
    res.json({ ...user, userProfile });
  });
  
/**
 * @swagger
 * /users/{email}:
 *   patch:
 *     summary: Update a user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         required: true
 *         description: Email of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Successfully updated user password
 *       500:
 *         description: An error occurred while updating the user password
 */
  router.patch("/:email", async (req: Request, res: Response) => {
    try {
      const email = req.params.email;
      const { password } = req.body;
  
      // Hash the password using Argon2
      const hashedPassword = await argon2.hash(password);
  
      const updatedUser = await prisma.user.update({
        where: {
          email: email,
        },
        data: {
          password: hashedPassword,
        },
      });
  
      // Create a custom response object without the password field
      const userResponse = {
        id: updatedUser.userId,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        message: "Your password has been successfully updated! Don't lose it this time...",
      };
  
      res.json(userResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while updating the user." });
    }
  });
  
/**
 * @swagger
 * /users/{email}:
 *   delete:
 *     summary: Delete a user by email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         required: true
 *         description: Email of the user
 *     responses:
 *       200:
 *         description: Successfully deleted user
 *       500:
 *         description: An error occurred while deleting the user
 */
  router.delete("/:email", async (req: Request, res: Response) => {
    try {
      const email = req.params.email;
  
      const deletedUser = await prisma.user.delete({
        where: {
          email: email,
        },
        select: {
          userId: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
  
      res.json(deletedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while deleting the user." });
    }
  });


/**
 * @swagger
 * /users/{userId}/promote:
 *   patch:
 *     summary: Promote a user to the ADMIN role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Successfully promoted user to ADMIN role
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: An error occurred while promoting the user
 */    
  router.patch('/:userId/promote', authGuard, async (req: CustomRequest, res: Response) => {
    const { userId } = req.params;
  
    // Check if the user making the request is an ADMIN
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
  
    try {
      const updatedUser = await prisma.user.update({
        where: { userId },
        data: { role: 'ADMIN' },
      });
  
      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while promoting the user.' });
    }
  });

/**
 * @swagger
 * /users/{userId}/demote:
 *   patch:
 *     summary: Demote a user to the VERIFIED role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Successfully demoted user to VERIFIED role
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: An error occurred while demoting the user
 */  
  router.patch('/:userId/demote', authGuard, async (req: CustomRequest, res: Response) => {
    const { userId } = req.params;
  
    // Check if the user making the request is an ADMIN
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
  
    try {
      const updatedUser = await prisma.user.update({
        where: { userId },
        data: { role: 'VERIFIED' },
      });
  
      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while demoting the user.' });
    }
  });

  
  
  export { router as userController };
