import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard } from '../auth/auth.guard';
import { CustomRequest } from '../types';


const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     description: Create a new product. Requires VERIFIED or ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 description: The product's name.
 *               productCategory:
 *                 type: string
 *                 description: The product's category.
 *               productComments:
 *                 type: string
 *                 description: Additional comments about the product.
 *     responses:
 *       201:
 *         description: The created product.
 *       400:
 *         description: The product already exists in the database.
 *       403:
 *         description: Insufficient permissions.
 *       500:
 *         description: An error occurred while creating the product.
 */

// Create a new product (requires VERIFIED or ADMIN role)
router.post('/', authGuard, async (req: CustomRequest, res: Response) => {
    if (req.user.role !== 'VERIFIED' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
  
    const { productName, productCategory, productComments } = req.body;
  
    try {
      const existingProduct = await prisma.product.findUnique({
        where: {
          productName,
        },
      });
  
      if (existingProduct) {
        return res.status(400).json({
          message:
            "The product you entered already exists in the database. If you want to update the price, please use the 'update' feature.",
        });
      }
  
      const newProduct = await prisma.product.create({
        data: {
          productName,
          productCategory,
          productComments,
          createdBy: {
            connect: {
              userId: req.user.userId,
            },
          },
          updatedBy: {
            connect: {
              userId: req.user.userId,
            },
          },
        },
      });
  
      res.status(201).json(newProduct);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while creating the product.' });
    }
  });
  
  /**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     description: Get a list of all products.
 *     responses:
 *       200:
 *         description: A list of products.
 *       500:
 *         description: An error occurred while fetching products.
 */
  router.get('/', async (req: CustomRequest, res: Response) => {
    try {
      const products = await prisma.product.findMany({
        select: {
          productId: true,
          productName: true,
          productCategory: true,
          productComments: true,
        },
      });
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching products.' });
    }
  });


  /**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     description: Get a product by its ID
 *     security:
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The product ID.
 *     responses:
 *       200:
 *         description: The product with the specified ID.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: An error occurred while fetching the product.
 */
  router.get('/:id', async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    try {
      const product = await prisma.product.findUnique({
        where: { productId: id },
        select: {
          productId: true,
          productName: true,
          productCategory: true,
          productComments: true,
        },
      });
  
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ message: 'Product not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the product.' });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product by ID
 *     tags: [Products]
 *     description: Update a product by its ID. Requires VERIFIED or ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The product ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 description: The product's name.
 *               productCategory:
 *                 type: string
 *                 description: The product's category.
 *               productComments:
 *                 type: string
 *                 description: Additional comments about the product.
 *     responses:
 *       200:
 *         description: The updated product.
 *       403:
 *         description: Insufficient permissions.
 *       500:
 *         description: An error occurred while updating the product.
 */
router.patch('/:id', authGuard, async (req: CustomRequest, res: Response) => {
    if (req.user.role !== 'VERIFIED' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
  
    const { id } = req.params;
    const { productName, productCategory, productComments, price } = req.body;
  
    try {
      const updateData: any = {
        updatedBy: {
          connect: {
            userId: req.user.userId,
          },
        },
      };

      if (req.user.role === 'ADMIN') {
        if (productName) {
          updateData.productName = productName;
        }
        if (productCategory) {
          updateData.productCategory = productCategory;
        }
        if (productComments) {
          updateData.productComments = productComments;
        }
      }
  
      const updatedProduct = await prisma.product.update({
        where: {
          productId: id,
        },
        data: updateData,
        select: {
          productId: true,
          productName: true,
          productCategory: true,
          productComments: true,
          updatedAt: true,
          updatedBy: {
            select: {
              userId: true,
              email: true,
            },
          },
        },
      });
  
      res.json(updatedProduct);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while updating the product.' });
    }
  });

   /**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     description: Delete a product by its ID. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The product ID.
 *     responses:
 *       200:
 *         description: The deleted product and a success message.
 *       403:
 *         description: Insufficient permissions.
 *       500:
 *         description: An error occurred while deleting the product.
 */
  // Delete a product (requires VERIFIED or ADMIN role)
  router.delete('/:id', authGuard, async (req: CustomRequest, res: Response) => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
  
    const { id } = req.params;
    try {
      const deletedProduct = await prisma.product.delete({
        where: { productId: id },
      });
  
      res.json({ message: 'Product deleted successfully.', deletedProduct });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while deleting the product.' });
    }
  });
  
  export {router as productController };